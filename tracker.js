const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7Rtp4l6wL_El-gR263MLrNfABY4eofkw-40SPu2R9DAR2JrZDwyt7jmJo-LZ0fVT5Xg/exec";

function sendGameResult(gameName, score, status) {
    // Автоматично беремо ім'я, яке гравець ввів на головній сторінці
    const playerName = localStorage.getItem("playerName") || "Гість";
    
    const payload = {
        game: gameName,
        player: playerName,
        score: score,
        status: status
    };

    // Відправляємо дані у вашу Google Таблицю
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(() => console.log("Результат успішно надіслано в таблицю!"))
    .catch(err => console.error("Помилка відправки:", err));
}
