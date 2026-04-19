from fastapi import APIRouter

router = APIRouter()

MOCK_VENDORS = [
    {
        "id": "f1",
        "name": "Stadium Burgers",
        "type": "Fast Food",
        "lat": 12.9780,
        "lng": 77.5908, # Near Food Court
        "menu": [
            {"item": "Classic Cheeseburger", "price": "150 INR"},
            {"item": "Veggie Burger", "price": "130 INR"},
            {"item": "French Fries", "price": "80 INR"},
            {"item": "Cold Drink", "price": "50 INR"}
        ]
    },
    {
        "id": "f2",
        "name": "Pizza Corner",
        "type": "Pizza",
        "lat": 12.9786,
        "lng": 77.5910, # Near Concourse 1
        "menu": [
            {"item": "Pepperoni Slice", "price": "200 INR"},
            {"item": "Margherita Slice", "price": "180 INR"},
            {"item": "Garlic Bread", "price": "120 INR"}
        ]
    },
    {
        "id": "f3",
        "name": "Snack Bar",
        "type": "Snacks & Drinks",
        "lat": 12.9775,
        "lng": 77.5915, # Near South Stand
        "menu": [
            {"item": "Popcorn", "price": "100 INR"},
            {"item": "Nachos with Cheese", "price": "150 INR"},
            {"item": "Bottled Water", "price": "40 INR"}
        ]
    },
    {
        "id": "f4",
        "name": "The Coffee Kiosk",
        "type": "Cafe",
        "lat": 12.9795,
        "lng": 77.5915, # Near North Stand
        "menu": [
            {"item": "Espresso", "price": "90 INR"},
            {"item": "Cappuccino", "price": "120 INR"},
            {"item": "Chocolate Muffin", "price": "80 INR"}
        ]
    }
]

@router.get("/vendors")
def get_food_vendors():
    """Return list of food vendors, their locations, and menus."""
    return {"vendors": MOCK_VENDORS}
