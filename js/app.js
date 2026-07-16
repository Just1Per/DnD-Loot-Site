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

    const isLooted =
        localStorage.getItem(
            `loot-${item.id}`
        ) === "true";

    const isPrinted =
        localStorage.getItem(
            `printed-${item.id}`
        ) === "true";

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
                item.owner
                ?
                `<div class="owner-block">
                    Owner: ${item.owner}
                </div>`
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

    lootButton.addEventListener(
        "click",
        () =>
        {
            card.classList.toggle(
                "looted"
            );

            const looted =
                card.classList.contains(
                    "looted"
                );

            localStorage.setItem(
                `loot-${item.id}`,
                looted
            );

            lootButton.textContent =
                looted
                ? "Looted"
                : "Loot";

            updateStats();
        }
    );

    printButton.addEventListener(
        "click",
        () =>
        {
            card.classList.toggle(
                "printed"
            );

            const printed =
                card.classList.contains(
                    "printed"
                );

            localStorage.setItem(
                `printed-${item.id}`,
                printed
            );

            printButton.textContent =
                printed
                ? "Printed"
                : "Print";
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
                localStorage.getItem(
                    `loot-${item.id}`
                ) === "true"
            );
    }

    if (showUnlooted)
    {
        filtered =
            filtered.filter(item =>
                localStorage.getItem(
                    `loot-${item.id}`
                ) !== "true"
            );
    }

    if (showPrinted)
    {
        filtered =
            filtered.filter(item =>
                localStorage.getItem(
                    `printed-${item.id}`
                ) === "true"
            );
    }

    if (showNotPrinted)
    {
        filtered =
            filtered.filter(item =>
                localStorage.getItem(
                    `printed-${item.id}`
                ) !== "true"
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
            localStorage.getItem(
                `loot-${item.id}`
            ) === "true"
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

renderCards();