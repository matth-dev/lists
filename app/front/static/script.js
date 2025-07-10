show_archives_checkbox = document.getElementById("show_archives")
show_archives_checkbox.addEventListener("change", async () => display_lists(archived=show_archives_checkbox.checked));

async function display_lists(archived = false){
    const lists = await get_all_lists(archived);
    
    // Create div
    div_list_of_lists = document.getElementById("list_of_lists");
    div_list_of_lists.replaceChildren();

    // Create ul
    ul_list_of_lists = document.createElement("ul");
    ul_list_of_lists.setAttribute("id", "ul_lists")

    lists.forEach((list) => {
        // Create li
        li_list_of_lists = document.createElement("li");

        // Create button
        list_button = document.createElement('button');
        list_button.textContent = list.name;
        list_button.setAttribute("data-id", list.id)
        list_button.addEventListener("click", async () => {
            display_list_items(list.id);
        });

        // Append button to li
        li_list_of_lists.appendChild(list_button)

        // Append li to ul
        ul_list_of_lists.appendChild(li_list_of_lists)
    });

    // Append ul to div
    div_list_of_lists.appendChild(ul_list_of_lists)
}

async function get_all_lists(archived = false) {
    const url = `http://localhost:8000/lists/get_all?archived=${archived}`;
    try {
        const response = await fetch(url, {method: "GET"});
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
    
        const lists = await response.json();
        return lists;
    } catch (error) {
        console.error(error.message);
    }
}

async function display_list_items(list_id = null) {
    if (list_id == null) {
        const lists = await get_all_lists(archived=false);
        list_id = lists[0].id;
    }
    div_items_list = document.getElementById("items_list");
    div_items_list.replaceChildren();

    document.getElementById("active_list").setAttribute("data-id", list_id)

    const list = await get_one_list(list_id);

    document.getElementById("list_name").textContent = list.name

    list.items.forEach((item) => {
        itemDiv = document.createElement("div");

        itemDiv.classList.add("item");
        if (item.valid) itemDiv.classList.add("validated");
        itemDiv.setAttribute("data-id", item.id);
        itemDiv.addEventListener("click", () => validate_item(item.id))

        itemDiv.innerHTML = `
            <div class="item_text">${item.name}</div>
            <div class="item_qt">${item.qty}</div>
        `;

        delete_button = document.createElement("button");
        delete_button.textContent = "Delete"
        delete_button.classList.add("delete_item");
        delete_button.addEventListener("click", async (event) => {
            event.stopPropagation();
            await delete_items(item.id);
        });

        itemDiv.appendChild(delete_button);

        div_items_list.appendChild(itemDiv);
    });
}

async function get_one_list(list_id) {
    const url = `http://localhost:8000/lists/${list_id}`;
    try {
        const response = await fetch(url, {method: "GET"});
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const list = await response.json();
        return list;
    } catch (error) {
        console.error(error.message);
    }
}

async function delete_items(item_id) {
    const url = `http://localhost:8000/items/${item_id}/delete`;
    try {
        const response = await fetch(url, {method: "DELETE"});
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const item = await response.json();
    } catch (error) {
        console.error(error.message);
    }
    display_list_items(list_id = document.getElementById("active_list").getAttribute("data-id"));
}

async function create_list() {
    list_name = document.getElementById("new_list_name").value
    
    const url = `http://localhost:8000/lists/create`;
    try {
        const response = await fetch(url, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"name": list_name})
            }
        );
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const list = await response.json();
        display_lists(archived=false);
        display_list_items(list.id);
    } catch (error) {
        console.error(error.message);
    }
}

async function create_new_item() {
    list_id = document.getElementById("active_list").getAttribute("data-id");
    item_name = document.getElementById("new_item_text").value;
    item_qty = document.getElementById("new_item_qt").value;

    const url = `http://localhost:8000/lists/${list_id}/add_item`;

    try {
        const response = await fetch(url, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"name": item_name, "qty": item_qty ? item_qty : null})
            }
        );
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const item = await response.json();
    } catch (error) {
        console.error(error.message);
    }

    display_list_items(list_id)

}

async function validate_item(item_id) {
    const url = `http://localhost:8000/items/${item_id}/validate`;
    try {
        const response = await fetch(url, 
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"item_id": item_id})
            }
        );
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const item = await response.json();
        display_list_items(item.list_id);
    } catch (error) {
        console.error(error.message);
    }
    
}

async function archive_list() {
    list_id = document.getElementById("active_list").getAttribute("data-id");
    const url = `http://localhost:8000/lists/${list_id}/archive`;
    try {
        const response = await fetch(url, 
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"list_id": list_id})
            }
        );
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }
        const list = await response.json();
        if (list.archived !== true) {
            alert("To archive a list, all products must be validated");
        }
        else {
            alert("List archived");
            await display_lists(archived=false)
            await display_list_items()
        }
    } catch (error) {
        console.error(error.message);
    }
}