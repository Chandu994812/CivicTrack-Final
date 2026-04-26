const run = async () => {
    try {
        const fetch = global.fetch;
        // 1. Register
        const registerData = { name: "Test User", email: "test4@test.com", password: "password123", phone: "1234567890" };
        const regRes = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(registerData)
        });
        const regJson = await regRes.json();
        console.log("Register:", regRes.status, regJson);

        // 2. Login
        const loginRes = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test4@test.com", password: "password123" })
        });
        const loginJson = await loginRes.json();
        console.log("Login:", loginRes.status, loginJson);
        const userId = loginJson.user.id;

        // 3. Update Profile
        const updateData = { name: "Test User Updated", phone: "111", email: "test4@test.com", govId: "123", ward: "w1", avatar: "base64xxx" };
        const updateRes = await fetch(`http://localhost:5000/api/users/${userId}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateData)
        });
        const updateJson = await updateRes.json();
        console.log("Update:", updateRes.status, updateJson);
    } catch(e) {
        console.error(e);
    }
};
run();
