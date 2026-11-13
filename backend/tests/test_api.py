def trip(**over):
    body = {
        "started_at": "2026-10-28T18:30:00",
        "platform": "uber",
        "distance_mi": 5.1,
        "fare": 12.6,
        "tip": 2.0,
    }
    return {**body, **over}


def test_register_login_and_me(client, login):
    headers = login()
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "driver@example.com"


def test_create_trip_computes_total(client, login):
    headers = login()
    res = client.post("/trips", json=trip(), headers=headers)
    assert res.status_code == 201
    assert res.json()["total"] == 14.6


def test_validation_errors_return_422(client, login):
    headers = login()
    assert client.post("/trips", json=trip(distance_mi=0), headers=headers).status_code == 422
    assert client.post("/trips", json=trip(platform="taxi"), headers=headers).status_code == 422


def test_users_cannot_see_each_others_trips(client, login):
    alice = login("alice@example.com")
    bob = login("bob@example.com")
    created = client.post("/trips", json=trip(), headers=alice).json()
    assert client.get("/trips", headers=bob).json()["total"] == 0
    assert client.get(f"/trips/{created['id']}", headers=bob).status_code == 404

def test_expense_category_filter(client, login):
    headers = login()
    body = {"spent_on": "2026-11-01", "category": "gas", "amount": 42.5, "note": "Shell"}
    created = client.post("/expenses", json=body, headers=headers)
    assert created.status_code == 201

    gas = client.get("/expenses", params={"category": "gas"}, headers=headers)
    assert gas.status_code == 200
    assert len(gas.json()) == 1
    assert gas.json()[0]["amount"] == 42.5

    tolls = client.get("/expenses", params={"category": "tolls"}, headers=headers)
    assert tolls.json() == []

def test_summary_net(client, login):
    headers = login()

    # a trip on 2026-11-01: fare 12.6 + tip 2.0 = 14.6
    client.post("/trips", json=trip(started_at="2026-11-01T10:00:00"), headers=headers)

    # an expense the same day: 4.0
    client.post(
        "/expenses",
        json={"spent_on": "2026-11-01", "category": "tolls", "amount": 4},
        headers=headers,
    )

    res = client.get(
        "/summary",
        params={"start": "2026-11-01", "end": "2026-11-01"},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["earnings"] == 14.6
    assert data["expenses"] == 4.0
    assert data["net"] == 10.6
    assert data["trips"] == 1

def test_trips_rejects_end_before_start(client, login):
    headers = login()
    res = client.get("/trips", params={"start": "2026-11-13", "end": "2026-11-02"}, headers=headers)
    assert res.status_code == 422
    assert res.json()["detail"] == "end must be on or after start"
