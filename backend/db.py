# # SETS UP THE DB, URL CAN BE CHANGED AS SEEN FIT
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
USER = (os.getenv("user") or "").strip()
PASSWORD = (os.getenv("password") or "").strip()
HOST = (os.getenv("host") or "").strip()
PORT = (os.getenv("port") or "").strip()
DBNAME = (os.getenv("dbname") or "").strip()

# Construct the SQLAlchemy connection string.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL and all([USER, PASSWORD, HOST, PORT, DBNAME]):
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./medicine_inventory.db"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

try:
    with engine.connect():
        print("Connection successful!")
except Exception as e:
    print(f"Failed to connect to configured database: {e}")
    print("Falling back to local SQLite database: medicine_inventory.db")
    DATABASE_URL = "sqlite:///./medicine_inventory.db"
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False},
    )
    
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
