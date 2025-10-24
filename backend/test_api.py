import requests

# Register
res = requests.post("http://127.0.0.1:5000/auth/register", json={
    "username": "dharshini",
    "email": "dharshini@example.com",
    "password": "123456"
})
print("REGISTER:", res.json())

# Login
res = requests.post("http://127.0.0.1:5000/auth/login", json={
    "email": "dharshini@example.com",
    "password": "123456"
})
print("LOGIN:", res.json())
