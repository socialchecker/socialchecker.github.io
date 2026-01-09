console.log("script.js loaded");

window.checkRoblox = async function () {
    console.log("checkRoblox called");

    const input = document.getElementById("username");
    const result = document.getElementById("result");

    if (!input || !result) {
        console.error("Missing elements");
        return;
    }

    const username = input.value.trim();
    if (!username) {
        result.classList.remove("hidden");
        result.innerHTML = "<p class='error'>Enter a username</p>";
        return;
    }

    result.classList.remove("hidden");
    result.innerHTML = "<p class='loading'>Loading Roblox public data…</p>";

    try {
        // 1️⃣ Username → UserId (OFFICIAL API)
        const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: false
            })
        });

        const userData = await userRes.json();
        if (!userData.data || !userData.data.length) {
            throw new Error("User not found");
        }

        const user = userData.data[0];
        const userId = user.id;

        // 2️⃣ User info
        const info = await fetch(`https://users.roblox.com/v1/users/${userId}`).then(r => r.json());

        // 3️⃣ Avatar
        const avatar = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`
        ).then(r => r.json());

        // 4️⃣ Counts
        const followers = await fetch(
            `https://friends.roblox.com/v1/users/${userId}/followers/count`
        ).then(r => r.json());

        const friends = await fetch(
            `https://friends.roblox.com/v1/users/${userId}/friends/count`
        ).then(r => r.json());

        // 5️⃣ Account age
        const created = new Date(info.created);
        const now = new Date();
        const ageDays = Math.floor((now - created) / 86400000);

        result.innerHTML = `
            <img class="avatar" src="${avatar.data[0].imageUrl}">
            <h3>
                ${info.name}
                ${info.hasVerifiedBadge ? `<span class="verified">✔</span>` : ""}
            </h3>

            <div class="stats">
                <div><span>Created</span><b>${created.toLocaleDateString()}</b></div>
                <div><span>Account Age</span><b>${ageDays} days</b></div>
                <div><span>Followers</span><b>${followers.count}</b></div>
                <div><span>Friends</span><b>${friends.count}</b></div>
            </div>

            <a class="btn outline"
               href="https://www.roblox.com/users/${userId}/profile"
               target="_blank">
               Open Roblox Profile
            </a>
        `;

        history.replaceState(null, "", `?username=${encodeURIComponent(username)}`);

    } catch (err) {
        console.error(err);
        result.innerHTML = `
            <p class="error">Roblox user not found or public data unavailable.</p>
        `;
    }
};
