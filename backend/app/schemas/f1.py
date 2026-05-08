from pydantic import BaseModel
from typing import Optional


class Driver(BaseModel):
    ''' Represents a single F1 Driver '''
    driver_id: str
    code: str
    number: Optional[str]
    first_name: str
    last_name: str
    nationality: str
    team: Optional[str]

class Constructor(BaseModel):
    ''' Represents a single F1 team/constructor '''
    constructor_id: str
    name: str
    nationality: str

class Race(BaseModel):
    ''' Represents a single race in the calender '''
    round: str
    race_name: str
    circuit_name: str
    country: str
    locality: str
    date: str
    time: Optional[str]

class DriverStanding(BaseModel):
    ''' Driver Championship Standings '''
    position: str
    points: str
    wins: str
    driver: Driver
    constructor: Constructor

class ConstructorStanding(BaseModel):
    ''' Constructor Championship Standings '''
    position: str
    points: str
    wins: str
    constructor: Constructor

class APIResponse(BaseModel):
    success: bool = True
    message: str = "Ok"
    data: Optional[dict | list] = None