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


def test_only_the_owner_can_delete_an_expense(client, login):
    alice = login("alice@example.com")
    bob = login("bob@example.com")
    body = {"spent_on": "2026-11-13", "category": "gas", "amount": 40}
    created = client.post("/expenses", json=body, headers=alice).json()

    assert client.delete(f"/expenses/{created['id']}", headers=bob).status_code == 404
    assert client.delete(f"/expenses/{created['id']}", headers=alice).status_code == 204
    assert client.delete(f"/expenses/{created['id']}", headers=alice).status_code == 404


def test_trip_routes_check_ownership(client, login):
    alice = login("alice@example.com")
    bob = login("bob@example.com")
    trip_id = client.post("/trips", json=trip(notes="Airport"), headers=alice).json()["id"]
    url = f"/trips/{trip_id}"

    # Bob gets the same 404 from every route, as if the trip didn't exist.
    assert client.get(url, headers=bob).status_code == 404
    assert client.patch(url, json={"fare": 1}, headers=bob).status_code == 404
    assert client.delete(url, headers=bob).status_code == 404

    # Alice can update: total is recomputed, and notes is the one field null clears.
    res = client.patch(url, json={"fare": 20, "notes": None}, headers=alice)
    assert res.status_code == 200
    assert res.json()["total"] == 22.0
    assert res.json()["notes"] is None

    assert client.delete(url, headers=alice).status_code == 204
    assert client.get(url, headers=alice).status_code == 404
