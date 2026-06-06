# ── Namespace ──────────────────────────────────────────────────────────────────
# A virtual cluster within the cluster. Isolates all f1-dashboard resources
# from anything else running on the same Kubernetes cluster.

resource "kubernetes_namespace" "f1_dashboard" {
  metadata {
    name = "f1-dashboard"
    labels = {
      "app.kubernetes.io/name" = "f1-dashboard"
    }
  }
}


# ── Backend: ConfigMap ─────────────────────────────────────────────────────────
# Non-sensitive configuration injected into the backend container as environment
# variables. Use a Kubernetes Secret for sensitive values (passwords, API keys).

resource "kubernetes_config_map" "backend_config" {
  metadata {
    name      = "backend-config"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
  }

  data = {
    JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1"
  }
}


# ── Backend: Deployment ────────────────────────────────────────────────────────
# Manages a group of identical backend pods. Kubernetes keeps exactly `replicas`
# healthy instances running at all times.

resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
    labels    = { app = "backend" }
  }

  spec {
    replicas = 2

    selector {
      match_labels = { app = "backend" }
    }

    # Zero-downtime rolling update: start 1 new pod, wait for it to be ready,
    # then stop 1 old pod. Repeat until all replicas are on the new version.
    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_surge       = 1
        max_unavailable = 0
      }
    }

    template {
      metadata {
        labels = { app = "backend" }
      }

      spec {
        container {
          name  = "backend"
          # The image tag is controlled by var.image_tag — set to the git SHA
          # in CI/CD so each deploy uses the exact freshly-built image.
          image = "${var.backend_image}:${var.image_tag}"

          port {
            container_port = 8000
          }

          # Inject all keys from the ConfigMap as environment variables.
          env_from {
            config_map_ref {
              name = kubernetes_config_map.backend_config.metadata[0].name
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          # Liveness probe: if this fails 3× in a row, K8s kills and restarts
          # the pod. Recovers from hung or deadlocked processes.
          liveness_probe {
            http_get {
              path = "/"
              port = "8000"
            }
            initial_delay_seconds = 15
            period_seconds        = 30
            failure_threshold     = 3
          }

          # Readiness probe: a pod only receives traffic after this passes.
          # Prevents the load balancer from sending requests to a pod that
          # hasn't finished starting up yet.
          readiness_probe {
            http_get {
              path = "/"
              port = "8000"
            }
            initial_delay_seconds = 5
            period_seconds        = 10
            failure_threshold     = 3
          }

          volume_mount {
            name       = "cache-volume"
            mount_path = "/app/cache"
          }
        }

        # emptyDir lives only as long as the pod. Replace with a
        # PersistentVolumeClaim if you want the cache to survive restarts.
        volume {
          name = "cache-volume"
          empty_dir {}
        }
      }
    }
  }

  # wait_for_rollout = true (default) makes "terraform apply" block until all
  # new pods are ready. This means a failed rollout fails the Terraform run —
  # the same guarantee kubectl rollout status provides.
  wait_for_rollout = true

  timeouts {
    create = "5m"
    update = "5m"
  }
}


# ── Backend: Service ───────────────────────────────────────────────────────────
# Gives the backend pods a stable DNS name inside the cluster.
# Any pod can reach the backend at http://backend:8000 regardless of which
# physical node the pods are scheduled on or what their IPs are.

resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
    labels    = { app = "backend" }
  }

  spec {
    type     = "ClusterIP"
    selector = { app = "backend" }

    port {
      name        = "http"
      port        = 8000
      target_port = 8000
    }
  }
}


# ── Frontend: Deployment ───────────────────────────────────────────────────────

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
    labels    = { app = "frontend" }
  }

  spec {
    replicas = 2

    selector {
      match_labels = { app = "frontend" }
    }

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_surge       = 1
        max_unavailable = 0
      }
    }

    template {
      metadata {
        labels = { app = "frontend" }
      }

      spec {
        container {
          name  = "frontend"
          image = "${var.frontend_image}:${var.image_tag}"

          port {
            container_port = 3000
          }

          # NEXT_PUBLIC_API_URL is baked into the JS bundle at Docker build time.
          # This env var is only kept here for documentation clarity.
          env {
            name  = "NODE_ENV"
            value = "production"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = "3000"
            }
            initial_delay_seconds = 20
            period_seconds        = 30
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/"
              port = "3000"
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 3
          }
        }
      }
    }
  }

  wait_for_rollout = true

  timeouts {
    create = "5m"
    update = "5m"
  }
}


# ── Frontend: Service ──────────────────────────────────────────────────────────

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
    labels    = { app = "frontend" }
  }

  spec {
    type     = "ClusterIP"
    selector = { app = "frontend" }

    port {
      name        = "http"
      port        = 3000
      target_port = 3000
    }
  }
}


# ── Ingress ────────────────────────────────────────────────────────────────────
# The single entry point for external HTTP traffic. Nginx routes requests to
# the right internal service based on the URL path:
#   /api/*  →  backend:8000
#   /*      →  frontend:3000
#
# Requires the Nginx Ingress Controller installed in your cluster:
#   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/
#     controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

resource "kubernetes_ingress_v1" "f1_dashboard" {
  metadata {
    name      = "f1-dashboard-ingress"
    namespace = kubernetes_namespace.f1_dashboard.metadata[0].name
    annotations = {
      "nginx.ingress.kubernetes.io/use-regex"          = "true"
      "nginx.ingress.kubernetes.io/proxy-read-timeout" = "60"
      "nginx.ingress.kubernetes.io/proxy-send-timeout" = "60"
      # cert-manager watches for this annotation and automatically provisions
      # a Let's Encrypt TLS certificate for the domain specified in tls[].hosts.
      # Install cert-manager first:
      #   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
      # Then create a ClusterIssuer pointing to Let's Encrypt (see k8s/cert-manager/).
      "cert-manager.io/cluster-issuer"                = "letsencrypt-prod"
      "nginx.ingress.kubernetes.io/ssl-redirect"      = "true"
    }
  }

  spec {
    ingress_class_name = "nginx"

    # TLS: cert-manager will create a Secret named "f1-dashboard-tls" in the
    # f1-dashboard namespace containing the Let's Encrypt certificate and key.
    tls {
      hosts       = [var.domain]
      secret_name = "f1-dashboard-tls"
    }

    rule {
      host = var.domain
      http {
        # All /api/* traffic → backend
        path {
          path      = "/api/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.backend.metadata[0].name
              port {
                number = 8000
              }
            }
          }
        }

        # Everything else → frontend
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.frontend.metadata[0].name
              port {
                number = 3000
              }
            }
          }
        }
      }
    }
  }
}
