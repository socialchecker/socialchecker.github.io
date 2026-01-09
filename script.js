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
    const username = input.value.trim();
    if (!username) return;

    const result = document.getElementById("result");
    result.classList.remove("hidden");
    result.innerHTML = `<p class="loading">Loading public Roblox data…</p>`;

    try {
        // 1️⃣ Username → UserID
        const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        });

        const userJson = await userRes.json();
        if (!userJson.data || !userJson.data.length) throw "USER_NOT_FOUND";

        const userId = userJson.data[0].id;

        // 2️⃣ User Info
        const infoRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        const info = await infoRes.json();

        // 3️⃣ Avatar
        const avatarRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
        );
        const avatar = await avatarRes.json();

        // 4️⃣ Counts
        const [followersRes, friendsRes] = await Promise.all([
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`)
        ]);

        const followers = await followersRes.json();
        const friends = await friendsRes.json();

        // 5️⃣ Account Age exakt
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

        // UI Render
        result.innerHTML = `
            <img class="avatar" src="${avatar.data[0].imageUrl}">
            <h3>
                ${info.name}
                ${info.isVerified ? `<span class="verified">✔</span>` : ""}
            </h3>

            <div class="stats">
                <div>
                    <span>Created</span>
                    <b>${created.toLocaleDateString()}</b>
                </div>
                <div>
                    <span>Account Age</span>
                    <b>${years}y ${months}m ${days}d</b>
                </div>
                <div>
                    <span>Followers</span>
                    <b>${followers.count}</b>
                </div>
                <div>
                    <span>Friends</span>
                    <b>${friends.count}</b>
                </div>
            </div>

            <a class="btn outline"
               href="https://www.roblox.com/users/${userId}/profile"
               target="_blank">
               Open Roblox Profile
            </a>
        `;

        // URL sync
        history.replaceState(null, "", `?username=${encodeURIComponent(username)}`);

    } catch (err) {
        console.error(err);
        result.innerHTML = `
            <p class="error">
                Public Roblox data not found.
            </p>
        `;
    }
}
