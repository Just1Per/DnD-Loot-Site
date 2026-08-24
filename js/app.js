import {
    db,
    auth,
    provider,
    signInWithPopup,
    signOut
}
from "./firebase.js";

import {items as sourceItems} from "./items.js";

import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let items = []; //Firestore items
let currentUserRole = "player"; //Default role for new users
let characters = []; //Firestore characters tied to users
let wishes = []; // Firestore wish records
let selectedCharacter = null; // Currently selected character for wishing
const editingItems = new Set();

async function loadItemsFromFirestore()
{
    items = (
        await getDocs(
            collection(db, "items")
        )
    ).docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    renderCards();
}

async function loadCharacters()
{
    characters = (
        await getDocs(
            collection(db, "characters")
        )
    ).docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    if (!selectedCharacter)
{
    const myCharacters =
        getCurrentUsersCharacters();

    if (myCharacters.length > 0)
    {
        selectedCharacter =
            myCharacters[0];
    }
}
}

async function loadWishes()
{
    const snapshot =
        await getDocs(
            collection(
                db,
                "wishes"
            )
        );

    wishes =
        snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
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

function attachEditEvents(
    card,
    item
)
{
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
                        ].map(box => box.value),

                    properties:
                        JSON.parse(
                            document.getElementById(
                                `edit-properties-${item.id}`
                            ).value
                        )
                }
            );

            editingItems.delete(item.id);

            await loadItemsFromFirestore();
        }
    );
}

function attachWishEvents(
    card,
    item
)
{
    const wishButton =
        card.querySelector(
            ".wish-button"
        );

    const myCharacters =
    getCurrentUsersCharacters();

    wishButton?.addEventListener(
    "click",
    async () =>
    {
        const myCharacters =
            getCurrentUsersCharacters();

        if (myCharacters.length === 0)
        {
            alert(
                "Create a character before wishing for items."
            );
            return;
        }

        const character =
            myCharacters[0];

        const existingWish =
            wishes.find(
                wish =>
                    wish.itemId === item.id &&
                    wish.characterId === character.id
            );

        if (existingWish)
        {
            alert(
                "This character has already wished for this item."
            );
            return;
        }

        await addDoc(
            collection(db, "wishes"),
            {
                itemId: item.id,
                characterId: character.id,
                created: Date.now()
            }
        );

        await loadWishes();

        renderCards();
    }
);
}

async function ensureUserExists()
{
    const userRef =
        doc(
            db,
            "users",
            auth.currentUser.uid
        );

    const userDoc =
        await getDoc(userRef);

    if (!userDoc.exists())
    {
        await setDoc(
            userRef,
            {
                email: auth.currentUser.email,
                role: "player",
                created: Date.now()
            }
        );
    }
}

function attachLootEvents(
    card,
    item
)
{
    const lootButton =
        card.querySelector(".loot-button");

    lootButton?.addEventListener(
        "click",
        async () =>
        {
            const newLootedState =
                !item.looted;

            await updateDoc(
                doc(db, "items", item.id),
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
}

function attachPrintEvents(
    card,
    item
)
{
    const printButton =
        card.querySelector(".print-button");

    printButton?.addEventListener(
        "click",
        async () =>
        {
            const newPrintedState =
                !item.printed;

            await updateDoc(
                doc(db, "items", item.id),
                {
                    printed: newPrintedState
                }
            );

            item.printed =
                newPrintedState;

            await loadItemsFromFirestore();
        }
    );
}

function getCurrentUsersCharacters()
{
    return characters.filter(
        character =>
            character.userId === auth.currentUser?.uid &&
            character.active
    );
}

function createCard(item)
{
    const card =
        document.createElement("div");
        console.log("CREATECARD VERSION 999");
    card.classList.add("item-card");

    const isAdmin =
    currentUserRole === "admin";

    const isEditing =
    isAdmin &&
    editingItems.has(item.id);

    const itemWishes =
    wishes.filter(
        wish =>
            wish.itemId === item.id
    );

    const myWish =
    wishes.find(
        wish =>
            wish.itemId === item.id &&
            wish.characterId === selectedCharacter?.id
    );

    const wishCharacterNames =
    itemWishes
        .map(wish =>
        {
            const character =
                characters.find(
                    c => c.id === wish.characterId
                );

            if (!character)
            {
                return "Unknown Character";
            }

            return `${character.name} (${character.class})`;
        })
        .join("<br>");

    item.rarity &&
    card.classList.add(
        item.rarity
            .toLowerCase()
            .replaceAll(" ", "-")
    );

    const isLooted =
    item.looted;

    const isPrinted =
    item.printed;

    const canWish =
    currentUserRole !== "admin"
    &&
    getCurrentUsersCharacters().length > 0;

    isLooted && card.classList.add("looted");
    isPrinted && card.classList.add("printed");
    
    card.innerHTML = `

 <div class="card-buttons">

    ${
        isAdmin
        ?
        `
        <button class="loot-button">
            ${isLooted ? "Looted" : "Loot"}
        </button>

        <button class="print-button">
            ${isPrinted ? "Printed" : "Print"}
        </button>

        ${
            isEditing
            ?
            `
            <button class="save-button">
                Save
            </button>

            <button class="cancel-button">
                Cancel
            </button>
            `
            :
            `
            <button class="edit-button">
                Edit
            </button>
            `
        }
        `
        :
        ""
    }

    ${
        canWish
        ?
        `
        <button class="wish-button">
            ${myWish ? "Wished" : "Wish"}
        </button>
        `
        :
        ""
    }

</div>

${
isAdmin
?
`
<div class="wish-admin-block">

    <strong>
        Wishes: ${itemWishes.length}
    </strong>

    <br><br>

    ${wishCharacterNames || "No wishes"}

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
    
        <div class="class-selector">
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
        <label class="class-option">

            <input
                type="checkbox"
                class="class-checkbox-${item.id}"
                value="${className}"
                ${
                    (item.classes || []).includes(className)
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
            <div class="card-meta">
                ${
                    (item.classes || [])
                        .map(className => `
                            <span class="meta-tag">
                                ${className}
                            </span>
                        `)
                        .join("")
                }
            </div>
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
        
        <div class="card-body">

            ${
            isEditing
            ?
            `
            <textarea
                class="edit-description"
                id="edit-description-${item.id}"
                placeholder="Item Description"
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

    attachEditEvents(
    card,
    item
);

attachLootEvents(
    card,
    item
);

attachPrintEvents(
    card,
    item
);

attachWishEvents(
    card,
    item
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
    
    const classFilter =
        document.getElementById("classFilter")
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

    if (rarityFilter)
    {
        filtered =
        filtered.filter(
            item => item.rarity === rarityFilter
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

    if (classFilter)
    {
        filtered =
            filtered.filter(item =>
                item.classes?.includes(classFilter)
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

    const resultCount = filtered.length;

    const lootedCount =
    filtered.filter(item => item.looted).length;

    const printedCount =
    filtered.filter(item => item.printed).length;

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



async function renderAdminPanel()
{
    if (currentUserRole !== "admin")
    {
        return;
    }

    const panel =
        document.getElementById("adminPanel");

    if (!panel)
    {
        return;
    }

    const snapshot =
        await getDocs(
            collection(db, "users")
        );

    const users =
        snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    panel.innerHTML =
        users.map(user => `
            <div>
                ${user.email}
                (${user.role})

                <button
                    class="make-admin"
                    data-userid="${user.id}">
                    Make Admin
                </button>
            </div>
        `).join("");

    panel
        .querySelectorAll(".make-admin")
        .forEach(button =>
        {
            button.addEventListener(
                "click",
                async () =>
                {
                    await updateDoc(
                        doc(
                            db,
                            "users",
                            button.dataset.userid
                        ),
                        {
                            role: "admin"
                        }
                    );
                }
            );
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
        document
    .getElementById("registerButton")
    ?.addEventListener(
        "click",
        async () =>
        {
            try
            {
                const email =
                    document.getElementById("emailInput").value;

                const password =
                    document.getElementById("passwordInput").value;

                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                alert(
                    "Account created successfully."
                );
            }
            catch (error)
            {
                console.error(error);
                alert(error.message);
            }
        }
    );

document
    .getElementById("createCharacterButton")
    ?.addEventListener(
        "click",
        async () =>
        {
            try
            {
                console.log("CREATE CHARACTER CLICKED");

                const characterName =
                    document.getElementById(
                        "characterName"
                    ).value;

                const characterClass =
                    document.getElementById(
                        "characterClass"
                    ).value;

                await addDoc(
                    collection(
                        db,
                        "characters"
                    ),
                    {
                        name: characterName,
                        class: characterClass,
                        userId: auth.currentUser.uid,
                        active: true,
                        created: Date.now()
                    }
                );

                console.log(
                    "CHARACTER SAVED"
                );

                await loadCharacters();

                alert(
                    "Character created."
                );
            }
            catch(error)
            {
                console.error(
                    "CHARACTER CREATE FAILED",
                    error
                );

                alert(error.message);
            }
        }
    );


document
    .getElementById("emailLoginButton")
    ?.addEventListener(
        "click",
        async () =>
        {
            try
            {
                const email =
                    document.getElementById("emailInput").value;

                const password =
                    document.getElementById("passwordInput").value;

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
            }
            catch (error)
            {
                console.error(error);
                alert(error.message);
            }
        }
    );

    document
    .getElementById("logoutButton")
    ?.addEventListener(
        "click",
        async () =>
        {
            try
            {
                await signOut(auth);

                console.log(
                    "Logged out"
                );
            }
            catch (error)
            {
                console.error(error);
            }
        }
    );

[
    "search",
    "rarityFilter",
    "sourceFilter",
    "campaignFilter",
    "categoryFilter",
    "classFilter",
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

async function loadCurrentUserRole()
{
    if (!auth.currentUser)
    {
        currentUserRole = "player";
        return;
    }

    const userDoc =
        await getDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid
            )
        );

    if (!userDoc.exists())
    {
        await setDoc(
            doc(
                db,
                "users",
                auth.currentUser.uid
            ),
            {
                email: auth.currentUser.email,
                role: "player"
            }
        );

        currentUserRole = "player";

        return;
        
    }

    currentUserRole =
        userDoc.data().role || "player";
}

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
            await ensureUserExists();
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
            await loadCurrentUserRole();
            await renderAdminPanel();
            //importItemsToFirestore();
            await loadCharacters();
            await loadWishes();
            await loadItemsFromFirestore();
            populateSourceFilter();
            populateCampaignFilter();
        }
        else
        {
            currentUserRole = "player";
            selectedCharacter = null;
            characters = [];
            wishes = [];
            
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