from app.core.collections import users_collection

user = {
    "email": "sarthak@college.edu",
    "container_id": "docker_container_123",
    "jti": "jwt_token_id_456",
    "hashed_password": "$2b$12$examplehashedpassword",
    "disabled": False
}

users_collection.insert_one(user)

print("User inserted successfully")