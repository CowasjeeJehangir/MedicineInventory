## file paths and directory locations
import os

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")