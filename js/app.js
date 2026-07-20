console.log("App.js loaded");
import {db} from "./firebase.js";
import {items as sourceItems} from "./items.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("Firebase connected", db);

let items = []; //Firestore items
let players = []; //Firestore players

async function loadItemsFromFirestore()
{
    const snapshot =
    await getDocs(collection(db, "items"));

items = 
    snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    console.log(items);

    renderCards();
}

async function loadPlayers()
{
    const snapshot =
    await getDocs(collection(db, "players"));

players = 
    snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    console.log(players);
}

function populateOwnerFilter()
{
    const filter =
        document.getElementById("ownerFilter");

    if (!filter)
    {
        return;
    }

    filter.innerHTML += `
    <option value="${player.id}">
        ${player.name}
    </option>
    `;

    players.forEach(player =>
    {
        filter.innerHTML += `
            <option value="${player.name}">
                ${player.name}
            </option>
        `;
    });
}

async function importItemsToFirestore()
{
    console.log("Items to import:", items.length);
    for (const item of sourceItems)
    {
        await setDoc(doc(db, "items", item.id), item);

        console.log("Uploaded:", item.name);
    }

    console.log("All items imported to Firestore.");
}

const container =
    document.getElementById("card-container");

function createCard(item)
{
    const card =
        document.createElement("div");

    card.classList.add("item-card");

    if (item.rarity)
    {
        card.classList.add(
            item.rarity
            .toLowerCase()
            .replaceAll(" ", "-")
        );
    }

    const ownerOptions =
    players.map(player => `
        <option
            value="${player.id}"
            ${
                item.owner === player.id
                ? "selected"
                : ""
            }
        >
            ${player.name}
        </option>
    `).join("");

    const isLooted =
        item.looted;

    const isPrinted =
    item.printed;

    if (isLooted)
    {
        card.classList.add("looted");
    }

    if (isPrinted)
    {
        card.classList.add("printed");
    }

    card.innerHTML = `

        <div class="card-buttons">

            <button class="loot-button">
                ${
                    isLooted
                    ? "Looted"
                    : "Loot"
                }
            </button>

            <button class="print-button">
                ${
                    isPrinted
                    ? "Printed"
                    : "Print"
                }
            </button>

        </div>

        <div class="watermark">
            LOOTED
        </div>

        <div class="card-header">

            <h2 class="item-name">
                ${item.name}
            </h2>

            <p class="item-type">
                ${item.category}
                ${
                    item.attunement
                    ? " (Requires Attunement)"
                    : ""
                }
            </p>

            <div class="card-meta">

                <span class="meta-tag ${item.rarity.toLowerCase().replaceAll(" ", "-")}">
                    ${item.rarity}
                </span>

                <span class="meta-tag">
                    ${item.source}
                </span>

                <span class="meta-tag">
                    ${item.campaign}
                </span>

            </div>

        </div>

        <img
            src="${item.image}"
            class="card-art"
            alt="${item.name}"
        >

        <div class="card-body">

            <div class="item-description">
                ${item.description}
            </div>

            ${
                item.properties
                .map(property => `
                    <div class="property-block">

                        <span class="property-title">
                            ${property.title}:
                        </span>

                        ${property.text}

                    </div>
                `)
                .join("")
            }

            ${
                item.looted
                ?
                `
                <div class="owner-block">

                    <select class="owner-select">

                        <option value="">
                            No Owner
                        </option>

                        ${ownerOptions}

                    </select>

                </div>
                `
                :
                ""
            }

            ${
                item.quote
                ?
                `<i>${item.quote}</i>`
                :
                ""
            }

        </div>

        <div class="card-footer">
            D&D 5e Magic Item Looter
        </div>

    `;

    const lootButton =
        card.querySelector(".loot-button");

    const printButton =
        card.querySelector(".print-button");

    const ownerSelect =
        card.querySelector(".owner-select");

    ownerSelect?.addEventListener(
        "change",
        async (event) =>
        {
            await updateDoc(
                doc(
                    db,
                    "items",
                    item.id
                ),
                {
                    owner:
                        event.target.value || null
                }
            );

            item.owner =
                event.target.value || null;

            await loadItemsFromFirestore();
        }
    );

    lootButton?.addEventListener(
    "click",
    async () =>
    {
        const newLootedState =
            !item.looted;

        await updateDoc(
            doc(
                db,
                "items",
                item.id
            ),
            {
                looted: newLootedState,

                owner:
                    newLootedState
                    ? item.owner
                    : null
            }
        );

        item.looted =
            newLootedState;

        if (!newLootedState)
        {
            item.owner = null;
        }

        await loadItemsFromFirestore();
    }
);

    printButton?.addEventListener(
    "click",
    async () =>
    {
        const newPrintedState =
            !item.printed;

        await updateDoc(
            doc(
                db,
                "items",
                item.id
            ),
            {
                printed: newPrintedState
            }
        );

        item.printed =
            newPrintedState;

        await loadItemsFromFirestore();
    }
);

    return card;
}

function renderCards()
{
    container.innerHTML = "";

    let filtered =
        [...items];

    const search =
        document.getElementById("search")
        ?.value
        .toLowerCase() || "";

    const classFilter =
        document.getElementById("classFilter")
        ?.value || "";

    const rarityFilter =
        document.getElementById("rarityFilter")
        ?.value || "";

    const ownerFilter =
        document.getElementById("ownerFilter")
        ?.value || "";

    const sourceFilter =
        document.getElementById("sourceFilter")
        ?.value || "";

    const campaignFilter =
        document.getElementById("campaignFilter")
        ?.value || "";

    const showLooted =
        document.getElementById("showLootedOnly")
        ?.checked;

    const showUnlooted =
        document.getElementById("showUnlootedOnly")
        ?.checked;

    const showPrinted =
        document.getElementById("showPrintedOnly")
        ?.checked;

    const showNotPrinted =
        document.getElementById("showNotPrintedOnly")
        ?.checked;

    filtered = filtered.filter(item =>
    {
        return (
            item.name
            .toLowerCase()
            .includes(search)

            ||

            item.description
            .toLowerCase()
            .includes(search)
        );
    });

    if (classFilter)
    {
        filtered =
            filtered.filter(item =>
                item.classes?.includes(
                    classFilter
                )
            );
    }

    if (ownerFilter)
    {
        filtered =
            filtered.filter(item =>
                item.owner === ownerFilter
            );
    }

    if (rarityFilter)
    {
        filtered =
            filtered.filter(item =>
                item.rarity === rarityFilter
            );
    }

    if (sourceFilter)
    {
        filtered =
            filtered.filter(item =>
                item.source === sourceFilter
            );
    }

    if (campaignFilter)
    {
        filtered =
            filtered.filter(item =>
                item.campaign === campaignFilter
            );
    }

    if (showLooted)
    {
        filtered =
            filtered.filter(item =>
                item.looted
            );
    }

    if (showUnlooted)
    {
        filtered =
            filtered.filter(item =>
                !item.looted
            );
    }

    if (showPrinted)
    {
        filtered =
            filtered.filter(item =>
                item.printed
            );
    }

    if (showNotPrinted)
    {
        filtered =
            filtered.filter(item =>
                !item.printed
            );
    }


    filtered.forEach(item =>
    {
        container.appendChild(
            createCard(item)
        );
    });

    updateStats();
}

function updateStats()
{
    const total =
        items.length;

    const looted =
        items.filter(item =>
            item.looted
        ).length;

    document.getElementById(
        "campaignStats"
    ).innerHTML = `
        Total Items: ${total}
        |
        Looted: ${looted}
        |
        Unlooted: ${total - looted}
        |
        Remaining: ${total - looted}
    `;
}

document
.getElementById("themeToggle")
?.addEventListener(
    "click",
    () =>
    {
        document.body.classList.toggle(
            "dark"
        );

        localStorage.setItem(
            "theme",
            document.body.classList.contains(
                "dark"
            )
        );
    }
);

if (
    localStorage.getItem("theme")
    === "true"
)
{
    document.body.classList.add(
        "dark"
    );
}

[
    "search",
    "ownerFilter",
    "classFilter",
    "rarityFilter",
    "sourceFilter",
    "campaignFilter",
    "showLootedOnly",
    "showUnlootedOnly",
    "showPrintedOnly",
    "showNotPrintedOnly"
]
.forEach(id =>
{
    const element =
        document.getElementById(id);

    if (element)
    {
        element.addEventListener(
            "input",
            renderCards
        );

        element.addEventListener(
            "change",
            renderCards
        );
    }
});

async function initializeApp()
{
    await loadPlayers();
    
    populateOwnerFilter();
    //importItemsToFirestore();
    loadItemsFromFirestore();
};

initializeApp();