document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("username");
    if (user) {
        document.getElementById("username").value = user;
        checkRoblox();
    }
});

async function checkRoblox() {
    const input = document.getElementById("username");
    const result = document.getElementById("result");

    const name = input.value.trim();
    if (!name) return;

    result.classList.remove("hidden");
    result.innerHTML = `<p class="loading">Fetching public Roblox data…</p>`;

    try {
        // 1️⃣ SEARCH USER (STABLE)
        const searchRes = await fetch(
            `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(name)}&limit=10`
        );
        const search = await searchRes.json();

        if (!search.data || !search.data.length) throw "USER_NOT_FOUND";

        const user = search.data.find(
            u => u.name.toLowerCase() === name.toLowerCase()
        );
        if (!user) throw "USER_NOT_FOUND";

        const userId = user.id;

        // 2️⃣ USER INFO
        const infoRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const info = await infoRes.json();

        // 3️⃣ AVATAR
        const avatarRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
        );
        const avatar = await avatarRes.json();

        // 4️⃣ COUNTS
        const [followersRes, friendsRes] = await Promise.all([
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`)
        ]);

        const followers = await followersRes.json();
        const friends = await friendsRes.json();

        // 5️⃣ ACCOUNT AGE
        const created = new Date(info.created);
        const now = new Date();

        let years = now.getFullYear() - created.getFullYear();
        let months = now.getMonth() - created.getMonth();
        let days = now.getDate() - created.getDate();

        if (days < 0) {
            months--;
            days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // RENDER
        result.innerHTML = `
            <img class="avatar" src="${avatar.data[0].imageUrl}">
            <h3>
                ${info.name}
                ${info.isVerified ? `<span class="verified">✔</span>` : ""}
            </h3>

            <div class="stats">
                <div><span>Created</span><b>${created.toLocaleDateString()}</b></div>
                <div><span>Account Age</span><b>${years}y ${months}m ${days}d</b></div>
                <div><span>Followers</span><b>${followers.count}</b></div>
                <div><span>Friends</span><b>${friends.count}</b></div>
            </div>

            <a class="btn outline"
               href="https://www.roblox.com/users/${userId}/profile"
               target="_blank">
               Open Roblox Profile
            </a>
        `;

        history.replaceState(null, "", `?username=${encodeURIComponent(name)}`);

    } catch (err) {
        console.error(err);
        result.innerHTML = `<p class="error">Roblox user not found.</p>`;
    }
}
