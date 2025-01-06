// Since we can't fetch every anime, we do the top 15:
let currentPage = 1;
const limit = 15;

// Fetch (get) top anime list
function fetchTopAnime() {
  fetch(`https://api.jikan.moe/v4/top/anime?limit=${limit}&page=${currentPage}`)
    .then((response) => response.json())
    .then((data) => {
      const animeList = document.getElementById("animeList");

      // MAde sure I did not use innerHTML to clear list
      while (animeList.firstChild) {
        animeList.removeChild(animeList.firstChild);
      }

      // Make a list with each anime we get from the API and style it
      data.data.forEach((anime) => {
        const listItem = document.createElement("li");
        listItem.textContent = anime.title;

        const img = document.createElement("img");
        img.src = anime.images.jpg.image_url;
        img.alt = anime.title;
        img.style.width = "50px";
        listItem.prepend(img);

        listItem.addEventListener("click", () => {
          const showMainCharacters = document.getElementById(
            "filterMainCharacters"
          ).checked;
          fetchCharacters(anime.mal_id, showMainCharacters);
        });

        animeList.appendChild(listItem);
      });
    })
    // As always, error just in case
    .catch((error) => console.error("Error fetching top anime:", error));
}

// Fetch (get) characters
function fetchCharacters(animeId, showMainCharacters) {
  fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`)
    .then((response) => response.json())
    .then((data) => {
      // Clear all tiers
      const tiers = document.querySelectorAll(".tier");
      tiers.forEach((tier) => {
        tier.replaceChildren(); // This is how to avoid using the forbidden innerHTML
        const header = document.createElement("h3");
        header.textContent = tier.dataset.tier;
        tier.appendChild(header);
      });

      const characterContainer = document.getElementById("characters");
      while (characterContainer.firstChild) {
        characterContainer.removeChild(characterContainer.firstChild);
      }

      // Show main characters if filter is checked
      const characters = showMainCharacters
        ? data.data.filter((char) => char.role === "Main")
        : data.data;

      // Make boxes for each character in the anime chosen
      characters.forEach((char) => {
        const characterDiv = document.createElement("div");
        characterDiv.classList.add("character");
        characterDiv.setAttribute("draggable", true);
        characterDiv.dataset.id = char.character.mal_id;

        // Add name and picture in the boxes
        const img = document.createElement("img");
        img.src = char.character.images.jpg.image_url;
        img.alt = char.character.name;

        const name = document.createElement("p");
        name.textContent = char.character.name;

        characterDiv.appendChild(img);
        characterDiv.appendChild(name);

        // Allow the box (div) to be dragged around
        addDragEvents(characterDiv);
        characterContainer.appendChild(characterDiv);
      });
    })
    // In case stuff fails, show it in the console log
    .catch((error) => console.error("Error fetching characters:", error));
}

// Make it drag-and-drop
function addDragEvents(characterDiv) {
  characterDiv.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", characterDiv.dataset.id);
  });
}

// Zones to drop stuff in
function setupDropZones() {
  const tiers = document.querySelectorAll(".tier");

  tiers.forEach((tier) => {
    tier.addEventListener("dragover", (e) => e.preventDefault());

    tier.addEventListener("drop", (e) => {
      e.preventDefault();
      const characterId = e.dataTransfer.getData("text/plain");
      const draggedCharacter = document.querySelector(
        `.character[data-id="${characterId}"]`
      );

      if (draggedCharacter) {
        tier.appendChild(draggedCharacter);
        saveTierList(currentPage); // Update localStorage!
      }
    });
  });
}

// Save to localStorage, IMPORTANT!
function saveTierList(animeId) {
  const tierData = {};
  const tiers = document.querySelectorAll(".tier");

  tiers.forEach((tier) => {
    const tierName = tier.dataset.tier;
    const characters = Array.from(tier.querySelectorAll(".character")).map(
      (char) => ({
        name: char.querySelector("p").textContent,
        image: char.querySelector("img").src,
      })
    );
    tierData[tierName] = characters;
  });

  localStorage.setItem(`tierList-${animeId}`, JSON.stringify(tierData));
}

// Load from localStorage, IMPORTANT to learn!
function loadTierList(animeId) {
  const savedTierData = localStorage.getItem(`tierList-${animeId}`);

  if (savedTierData) {
    const tierData = JSON.parse(savedTierData);

    for (const [tierName, characters] of Object.entries(tierData)) {
      const tier = document.querySelector(`.tier[data-tier="${tierName}"]`);
      if (tier) {
        tier.replaceChildren();
        const header = document.createElement("h3");
        header.textContent = tierName;
        tier.appendChild(header);

        characters.forEach((char) => {
          const characterDiv = document.createElement("div");
          characterDiv.classList.add("character");
          characterDiv.setAttribute("draggable", true);

          const img = document.createElement("img");
          img.src = char.image;
          img.alt = char.name;

          const name = document.createElement("p");
          name.textContent = char.name;

          characterDiv.appendChild(img);
          characterDiv.appendChild(name);

          addDragEvents(characterDiv);
          tier.appendChild(characterDiv);
        });
      }
    }
  }
}

// Add auto-scroll so you don't have to put them in F tier then upwards
function enableAutoScroll() {
  document.addEventListener(
    "dragover",
    throttle((e) => {
      const scrollMargin = 200;
      const scrollSpeed = 25;

      if (e.clientY < scrollMargin) {
        window.scrollBy(0, -scrollSpeed);
      } else if (e.clientY > window.innerHeight - scrollMargin) {
        window.scrollBy(0, scrollSpeed);
      }
    }, 50)
  );
}

// Throttle function
// (used to limit the frequency at which a given function can execute.
// It ensures that the function is invoked at most once every specified period of time,
// regardless of how many times the triggering event occurs during that period.)
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// DOMContentLoaded
// (means an event in JavaScript that fires when the initial HTML document has been completely
// loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.)
document.addEventListener("DOMContentLoaded", () => {
  loadTierList(currentPage);
  setupDropZones();
  fetchTopAnime();
  enableAutoScroll();
});

// Hamburger menu open
document.getElementById("menuButton").addEventListener("click", () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
});

// Close menu when an anime is selected
const menuItems = document.querySelectorAll("#menu"); //target all #menu elements
menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    document.getElementById("menu").style.display = "none";
  });
});

// "Clear All" Button
document.getElementById("clearAll").addEventListener("click", () => {
  const tiers = document.querySelectorAll(".tier");
  tiers.forEach((tier) => {
    tier.replaceChildren();
    const header = document.createElement("h3");
    header.textContent = tier.dataset.tier;
    tier.appendChild(header);
  });
  localStorage.removeItem(`tierList-${currentPage}`);
});

//TO DO NEXT:
//When "clear All" is pressed, the characters are completly deleted instead of sent back in to the list
//Make the page refresh when "show anime" is checked so user dont have to do it themselves if time
// Make tierlists on each anime be saved individualy and not mix, if there is time. Sounds kinda difficult?
