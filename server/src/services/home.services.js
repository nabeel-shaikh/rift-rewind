// In-memory store (replace with DB later if needed)
const store = {
    message: "Hello World",
    people: ["Shayan", "Arthur", "Nabeel", "Ali", "Hasan"],
};

async function getHomeData() {
    return { ...store };
}

async function addPerson(name) {
    if (!name || typeof name !== "string") throw new Error("Name is required");
    store.people.push(name);
    return { ok: true, people: store.people };
}

module.exports = { getHomeData, addPerson };
