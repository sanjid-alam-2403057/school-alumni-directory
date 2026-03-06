document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");
    const searchInput = document.getElementById("searchInput");
    let alumniData = [];

    // Fetch the alumni data
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            alumniData = data;
            displayAlumni(alumniData); // Show all alumni initially
        })
        .catch(error => console.error("Error loading alumni data:", error));

    // Function to create and display cards
    function displayAlumni(data) {
        container.innerHTML = ""; // Clear out old cards before loading new ones

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#666; width:100%;'>No alumni found matching your search.</p>";
            return;
        }

        data.forEach(alumnus => {
            const card = document.createElement("div");
            card.classList.add("alumni-card");

            // Clean, professional HTML without the emojis
            card.innerHTML = `
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                <h2>${alumnus.name}</h2>
                <p><strong>University:</strong> ${alumnus.university}</p>
                <p><strong>Department:</strong> ${alumnus.department}</p>
                <p><strong>Admission Year:</strong> ${alumnus.admissionYear}</p>
                <div class="badge">SSC Batch: ${alumnus.sscBatch}</div>
            `;

            container.appendChild(card);
        });
    }

    // Add live search functionality
    searchInput.addEventListener("input", (e) => {
        const searchString = e.target.value.toLowerCase();
        
        // Filter the data based on name, university, or SSC batch
        const filteredAlumni = alumniData.filter(alumnus => {
            return alumnus.name.toLowerCase().includes(searchString) ||
                   alumnus.university.toLowerCase().includes(searchString) ||
                   alumnus.sscBatch.toString().includes(searchString);
        });
        
        displayAlumni(filteredAlumni); // Display only the matching cards
    });
});
