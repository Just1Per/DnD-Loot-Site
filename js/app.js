import {db} from "./firebase.js";
import {items as sourceItems} from "./items.js";

import {
    auth,
    provider,
    signInWithPopup,
    signOut
}
from "./firebase.js";

import {
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

onAuthStateChanged(
    auth,
    user =>
    {
    const loginButton =
    document.getElementById("loginButton");

    const logoutButton =
        document.getElementById("logoutButton");

        const display =
            document.getElementById(
                "userDisplay"
            );

        if (user)
        {
            display.textContent =
                user.email;

            loginButton.style.display =
                "none";

            logoutButton.style.display =
                "inline-block";
        }
        else
        {
            display.textContent =
                "Not logged in";

            loginButton.style.display =
                "inline-block";

            logoutButton.style.display =
                "none";
        }
        renderCards();
    }
);

import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let items = []; //Firestore items
let players = []; //Firestore players
const editingItems = new Set();

async function loadItemsFromFirestore()
{
    const snapshot =
    await getDocs(collection(db, "items"));

items = 
    snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
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
}

function populateOwnerFilter()
{
    const filter =
        document.getElementById("ownerFilter");

    if (!filter)
    {
        return;
    }

    filter.innerHTML = `
        <option value="">All Owners</option>
    `;

    players.forEach(player =>
    {
        filter.innerHTML += `
            <option value="${player.id}">
                ${player.name}
            </option>
        `;
    });
}

async function importItemsToFirestore()
{
    for (const item of sourceItems)
    {
    await setDoc(
        doc(db, "items", item.id),
        item,
        { merge: true }
    );
    }

}

const container =
    document.getElementById("card-container");

function createCard(item)
{
    const card =
        document.createElement("div");
    card.classList.add("item-card");

    
    const isAdmin =
    auth.currentUser?.email ===
    "casper.n.andersen@gmail.com";
    
    /*
    const isAdmin = true;
    */
    const isEditing =
    isAdmin &&
    editingItems.has(item.id);

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

 ${
    isAdmin
    ?
    (
        isEditing
        ?
        `
        <div class="card-buttons">

            <button class="save-button">
                Save
            </button>

            <button class="cancel-button">
                Cancel
            </button>

        </div>
        `
        :
        `
        <div class="card-buttons">

            <button class="loot-button">
                ${isLooted ? "Looted" : "Loot"}
            </button>

            <button class="print-button">
                ${isPrinted ? "Printed" : "Print"}
            </button>

            <button class="edit-button">
                Edit
            </button>

        </div>
        `
    )
    :
    ""
}

    ${
        item.looted && isAdmin
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

        <div class="watermark">
            LOOTED
        </div>

        <div class="card-header">

            ${
            isEditing
            ?
            `
            <input
                class="edit-name"
                id="edit-name-${item.id}"
                value="${item.name}"
            >
            `
            :
            `
            <h2 class="item-name">
                ${item.name}
            </h2>
            `
            }

            ${
    isEditing
    ?
    `
    <select id="edit-category-${item.id}">
        <option value="Armor" ${item.category === "Armor" ? "selected" : ""}>Armor</option>
        <option value="Potion" ${item.category === "Potion" ? "selected" : ""}>Potion</option>
        <option value="Scroll" ${item.category === "Scroll" ? "selected" : ""}>Scroll</option>
        <option value="Wand" ${item.category === "Wand" ? "selected" : ""}>Wand</option>
        <option value="Weapon" ${item.category === "Weapon" ? "selected" : ""}>Weapon</option>
        <option value="Wondrous Item" ${item.category === "Wondrous Item" ? "selected" : ""}>Wondrous Item</option>
    </select>

    <label>
        <input
            type="checkbox"
            id="edit-attunement-${item.id}"
            ${item.attunement ? "checked" : ""}
        >
        Requires Attunement
    </label>
    <div class="class-editor">
        ${
        [
            "Artificer",
            "Barbarian",
            "Bard",
            "Cleric",
            "Druid",
            "Fighter",
            "Monk",
            "Paladin",
            "Ranger",
            "Rogue",
            "Sorcerer",
            "Warlock",
            "Wizard"
        ]
        .map(className => `
        <label>
            <input
                type="checkbox"
                class="class-checkbox-${item.id}"
                value="${className}"
                ${
                    (item.classes || [])
                        .includes(className)
                        ? "checked"
                        : ""
                }
            >
            ${className}
        </label>
        `)
        .join("")
        }
        </div>
    `
    
    :
    
    `
    <p class="item-type">
        ${item.category}
        ${item.attunement ? " (Requires Attunement)" : ""}
    </p>
    `
}
        ${
            item.classes?.length
            ?
            `
            <div class="class-tag">
                ${item.classes.join(", ")}
            </div>
            `
            :
            ""
        }
            <div class="card-meta">
                ${
                isEditing
                ?
                `
                <select id="edit-rarity-${item.id}">
                    <option value="Common" ${item.rarity === "Common" ? "selected" : ""}>Common</option>
                    <option value="Uncommon" ${item.rarity === "Uncommon" ? "selected" : ""}>Uncommon</option>
                    <option value="Rare" ${item.rarity === "Rare" ? "selected" : ""}>Rare</option>
                    <option value="Very Rare" ${item.rarity === "Very Rare" ? "selected" : ""}>Very Rare</option>
                    <option value="Legendary" ${item.rarity === "Legendary" ? "selected" : ""}>Legendary</option>
                </select>
                `
                :
                `
                <span class="meta-tag ${item.rarity.toLowerCase().replaceAll(" ", "-")}">
                    ${item.rarity}
                </span>
                `
                }

                ${
                isEditing
                ?
                `
                <input
                id="edit-source-${item.id}"
                value="${item.source || ""}"
                placeholder="Source"
                >
                `
                :
                `
                <span class="meta-tag">
                    ${item.source || ""}
                </span>
                `
                }

                ${
                    isEditing
                    ?
                    `
                    <input
                        id="edit-classes-${item.id}"
                        placeholder="Wizard, Cleric, Druid"
                        value="${(item.classes || []).join(", ")}"
                    >
                    `
                    :
                    ""
                }

                ${
                isEditing
                ?
                `
                <input
                id="edit-campaign-${item.id}"
                value="${item.campaign || ""}"
                placeholder="Campaign"
                >
                `
                :
                `
                <span class="meta-tag">
                    ${item.campaign || ""}
                </span>
                `
                }

            </div>

        </div>

        ${
            isEditing
            ?
            `
            <input
                id="edit-image-${item.id}"
                value="${item.image || ""}"
                placeholder="Image URL"
            >
            `
            :
            ""
        }
        <img
            src="${item.image}"
            class="card-art"
            alt="${item.name}"
        >

        <div class="card-body">

            ${
            isEditing
            ?
            `
            <textarea
                class="edit-description"
                id="edit-description-${item.id}"
            >${item.description}</textarea>
            `
            :
            `
            <div class="item-description">
                ${item.description}
            </div>
            `
            }

            ${
            isEditing
            ?
            `
            <textarea
                id="edit-properties-${item.id}"
            >${JSON.stringify(item.properties || [], null, 2)}</textarea>
            `
            :
            (item.properties || []).map(property => `
    <div class="property-block">

        <span class="property-title">
            ${property.title}:
        </span>

        ${property.text}

    </div>
`).join("")
            }

            ${
            isEditing
            ?
            `
            <textarea
                id="edit-quote-${item.id}"
                placeholder="Quote"
            >${item.quote || ""}</textarea>
            
            `
            :
            `
            <i>${item.quote || ""}</i>
            `
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

    const editButton =
    card.querySelector(".edit-button");

    const saveButton =
    card.querySelector(".save-button");

    const cancelButton =
    card.querySelector(".cancel-button");

    editButton?.addEventListener(
    "click",
    () =>
    {
        editingItems.add(item.id);

        renderCards();
    }
    );

    cancelButton?.addEventListener(
    "click",
    () =>
    {
        editingItems.delete(item.id);

        renderCards();
    }
    );

    saveButton?.addEventListener(
    "click",
    async () =>
    {
        await updateDoc(
            doc(db, "items", item.id),
            {
                name:
                    document.getElementById(`edit-name-${item.id}`).value,

                description:
                    document.getElementById(`edit-description-${item.id}`).value,

                category:
                    document.getElementById(`edit-category-${item.id}`).value,

                rarity:
                    document.getElementById(`edit-rarity-${item.id}`).value,

                source:
                    document.getElementById(`edit-source-${item.id}`).value,

                campaign:
                    document.getElementById(`edit-campaign-${item.id}`).value,

                image:
                    document.getElementById(`edit-image-${item.id}`).value,

                quote:
                    document.getElementById(`edit-quote-${item.id}`).value,

                attunement:
                    document.getElementById(`edit-attunement-${item.id}`).checked,
                
                classes:
                [
                    ...document.querySelectorAll(
                        `.class-checkbox-${item.id}:checked`
                    )
                ]
                .map(box => box.value),

                properties:
                    JSON.parse(
                        document.getElementById(`edit-properties-${item.id}`).value
                    )
            }
        );

        editingItems.delete(item.id);

        await loadItemsFromFirestore();
    }
    );


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

    const rarityFilter =
        document.getElementById("rarityFilter")
        ?.value || "";

    const sourceFilter =
        document.getElementById("sourceFilter")
        ?.value || "";

    const campaignFilter =
        document.getElementById("campaignFilter")
        ?.value || "";

    const ownerFilter =
        document.getElementById("ownerFilter")
        ?.value || "";

    const categoryFilter =
        document.getElementById("categoryFilter")
        ?.value || "";

    const showLooted =
        document.getElementById("showLootedOnly")
        ?.checked;

    const showUnlooted =
        document.getElementById("showUnlootedOnly")
        ?.checked;

    const showAttunement =
        document.getElementById("showAttunementOnly")
        ?.checked;

    const showNoAttunement =
        document.getElementById("showNoAttunementOnly")
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

    if (categoryFilter)
    {
        filtered =
            filtered.filter(item =>
                item.category === categoryFilter
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

    if (showAttunement)
    {
        filtered =
            filtered.filter(item =>
                item.attunement
            );
    }

    if (showNoAttunement)
    {
        filtered =
            filtered.filter(item =>
                !item.attunement
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

    const resultCount =
        filtered.length;

    const lootedCount =
        filtered.filter(item =>
            item.looted
        ).length;

    const printedCount =
        filtered.filter(item =>
            item.printed
        ).length;

    updateStats(
        resultCount,
        lootedCount,
        printedCount
    );
}
/*
function updateStats()
{
    const total =
        items.length;

    const looted =
        items.filter(item =>
            item.looted
        ).length;


    const printed =
        items.filter(item =>
            item.printed
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
        |
        Printed: ${printed}
    `;
}*/

function populateSourceFilter()
{
    const filter =
        document.getElementById(
            "sourceFilter"
        );

    if (!filter)
    {
        return;
    }

    const sources =
        [...new Set(
            items
            .map(item => item.source)
            .filter(Boolean)
        )]
        .sort();

    filter.innerHTML =
        `<option value="">All Sources</option>`;

    sources.forEach(source =>
    {
        filter.innerHTML += `
            <option value="${source}">
                ${source}
            </option>
        `;
    });
}

function populateCampaignFilter()
{
    const filter =
        document.getElementById(
            "campaignFilter"
        );

    if (!filter)
    {
        return;
    }

    const campaigns =
        [...new Set(
            items
            .map(item => item.campaign)
            .filter(Boolean)
        )]
        .sort();

    filter.innerHTML =
        `<option value="">All Campaigns</option>`;

    campaigns.forEach(campaign =>
    {
        filter.innerHTML += `
            <option value="${campaign}">
                ${campaign}
            </option>
        `;
    });
}

function updateStats(
    results,
    looted,
    printed
)
{
    document.getElementById(
        "campaignStats"
    ).innerHTML = `
        Results: ${results}
        |
        Looted: ${looted}
        |
        Printed: ${printed}
    `;
}

    const loginButton =
        document.getElementById("loginButton")
        ?.addEventListener(
            "click",
            async () =>
            {
                try
                {
                    const result =
                        await signInWithPopup(
                            auth,
                            provider
                        );

                    console.log(
                        "Logged in:",
                        result.user.email
                    );
                }
                catch (error)
                {
                    console.error(error);
                }
            }
        );

    const logoutButton =
        document.getElementById("logoutButton")
        ?.addEventListener(
            "click",
            async () =>
            {
                await signOut(auth);
            }
        );

[
    "search",
    "ownerFilter",
    "rarityFilter",
    "sourceFilter",
    "campaignFilter",
    "categoryFilter",
    "showLootedOnly",
    "showUnlootedOnly",
    "showAttunementOnly",
    "showNoAttunementOnly",
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

onAuthStateChanged(
    auth,
    async (user) =>
    {
        const loginButton =
            document.getElementById("loginButton");

        const logoutButton =
            document.getElementById("logoutButton");

        const display =
            document.getElementById("userDisplay");

        if (user)
        {
            display.textContent =
                user.email;

            loginButton.style.display =
                "none";

            logoutButton.style.display =
                "inline-block";

            console.log(
                "Logged in as:",
                user.email
            );

            await loadPlayers();

            populateOwnerFilter();

            //importItemsToFirestore();

            await loadItemsFromFirestore();

            populateSourceFilter();

            populateCampaignFilter();
        }
        else
        {
            display.textContent =
                "Not logged in";

            loginButton.style.display =
                "inline-block";

            logoutButton.style.display =
                "none";

            renderCards();
        }
    }
);