import sys
import os
from dotenv import load_dotenv

api_dir = os.path.join(os.path.dirname(__file__), '..', 'apps', 'api')
sys.path.insert(0, api_dir)

env_path = os.path.join(api_dir, '.env')
load_dotenv(env_path)

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine, Base
from core.security import get_password_hash

import models

from models import User, UserRole, Client, Location, PiholeInstance, PiholeMode


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def seed_database():
    db: Session = SessionLocal()
    
    try:
        print("\n🌱 Seeding database...")
        
        demo_client = db.query(Client).filter(Client.slug == "empresa-demo").first()
        if not demo_client:
            demo_client = Client(
                name="Empresa Demo",
                slug="empresa-demo",
                is_active=True
            )
            db.add(demo_client)
            db.commit()
            db.refresh(demo_client)
            print("✓ Demo client created: Empresa Demo")
        else:
            print("⊙ Demo client already exists")
        
        admin_user = db.query(User).filter(User.email == "admin@novaguardian.com").first()
        if not admin_user:
            admin_user = User(
                name="Administrador",
                email="admin@novaguardian.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                client_id=demo_client.id
            )
            db.add(admin_user)
            print("✓ Admin user created: admin@novaguardian.com / admin123")
        else:
            if admin_user.client_id is None:
                admin_user.client_id = demo_client.id
                db.commit()
                print("⊙ Admin user updated with client assignment")
            else:
                print("⊙ Admin user already exists")
        
        demo_user = db.query(User).filter(User.email == "user@example.com").first()
        if not demo_user:
            demo_user = User(
                name="Usuário Demo",
                email="user@example.com",
                password_hash=get_password_hash("user123"),
                role=UserRole.USER,
                client_id=demo_client.id
            )
            db.add(demo_user)
            print("✓ Demo user created: user@example.com / user123")
        else:
            if demo_user.client_id is None:
                demo_user.client_id = demo_client.id
                db.commit()
                print("⊙ Demo user updated with client assignment")
            else:
                print("⊙ Demo user already exists")
        
        db.commit()
        
        demo_location = db.query(Location).filter(Location.label == "Escritório Central").first()
        if not demo_location:
            demo_location = Location(
                client_id=demo_client.id,
                label="Escritório Central",
                public_ip="203.0.113.10",
                is_active=True
            )
            db.add(demo_location)
            db.commit()
            print("✓ Demo location created: Escritório Central")
        else:
            print("⊙ Demo location already exists")
        
        demo_pihole = db.query(PiholeInstance).filter(
            PiholeInstance.container_name == "pihole_cliente_demo"
        ).first()
        if not demo_pihole:
            demo_pihole = PiholeInstance(
                client_id=demo_client.id,
                container_name="pihole_cliente_demo",
                upstream_dns1="1.1.1.1",
                upstream_dns2="8.8.8.8",
                mode=PiholeMode.NXDOMAIN
            )
            db.add(demo_pihole)
            db.commit()
            print("✓ Demo Pi-hole instance metadata created")
        else:
            print("⊙ Demo Pi-hole instance already exists")
        
        print("\n✅ Database seeded successfully!")
        print("\n📋 Login Credentials:")
        print("   Admin:  admin@novaguardian.com / admin123")
        print("   User:   user@example.com / user123")
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 NovaGuardianTech - Database Setup")
    create_tables()
    seed_database()
