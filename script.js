function normalizeText(value) {

    return String(value || "")

        .trim()

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .toLowerCase();

}

let voiceRecorder = null;
let voiceStream = null;
let voiceChunks = [];
let isVoiceRecording = false;

function requestMicrophoneAccess() {

    return new Promise((resolve, reject) => {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

            reject(new Error("Microfonul nu este disponibil în acest browser."));

            return;

        }

        navigator.mediaDevices.getUserMedia({ audio: true })

            .then(stream => {

                stream.getTracks().forEach(track => track.stop());

                resolve();

            })

            .catch(() => {

                reject(new Error("Trebuie să activezi accesul la microfon."));

            });

    });

}

function checkTransaction() {

    const amountValue =

        document.getElementById("amount").value;

    const amount =

        Number(amountValue);

    const recipient =

        document.getElementById("recipient").value.trim() || "Destinatar necunoscut";

    const location =

        normalizeText(document.getElementById("location").value);

    const result =

        document.getElementById("transactionResult");

    let risk = 0;

    if (!Number.isFinite(amount) || amount <= 0) {

        result.className = "danger";

        result.innerHTML =

            "❌ Suma introdusă nu este validă.<br>" +

            "Introduceți o valoare numerică pozitivă.";

        return;

    }

    // Dacă suma este mare,

    // creștem nivelul de risc

    if (amount >= 5000) {

        risk += 60;

    }

    // Verificăm locația

    if (location !== "chisinau") {

        risk += 30;

    }

    // Dacă riscul este mare

    if (risk >= 60) {

        result.className = "danger";

        result.innerHTML =

            "🚨 ALERTĂ DE FRAUDĂ!<br><br>" +

            "Tranzacția către <b>" +

            recipient +

            "</b> de " +

            amount.toLocaleString("ro-RO") +

            " MDL a fost considerată suspectă." +

            "<br><br>" +

            "🔒 Tranzacție ANULATĂ." +

            "<br>" +

            "📱 Utilizatorul a fost alertat.";

    }

    else {

        result.className = "safe";

        result.innerHTML =

            "✅ Tranzacție verificată.<br>" +

            "Nivel de risc: scăzut.";

    }

}

/* ÎNREGISTRARE VOCE */

function startVoice() {

    const result =

        document.getElementById("voiceResult");

    const button =

        document.getElementById("voiceButton");

    const audio =

        document.getElementById("voicePlayback");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        result.className = "danger";

        result.innerHTML =

            "❌ Acest browser nu suportă înregistrarea vocală.";

        return;

    }

    if (!window.isSecureContext) {

        result.className = "danger";

        result.innerHTML =

            "❌ Pentru a folosi microfonul, deschide pagina prin localhost/HTTPS.";

        return;

    }

    if (isVoiceRecording) {

        if (voiceRecorder && voiceRecorder.state !== "inactive") {

            voiceRecorder.stop();

        }

        if (voiceStream) {

            voiceStream.getTracks().forEach(track => track.stop());

        }

        isVoiceRecording = false;

        button.textContent = "🎤 Înregistrează mesaj vocal";

        return;

    }

    result.className = "";

    result.innerHTML =

        "🎙️ Întreabă și ține apăsat, apoi apasă din nou pentru a opri...";

    button.textContent = "⏹️ Oprește înregistrarea";

    navigator.mediaDevices.getUserMedia({ audio: true })

        .then(stream => {

            voiceStream = stream;

            voiceChunks = [];

            voiceRecorder = new MediaRecorder(stream);

            voiceRecorder.ondataavailable = function(event) {

                if (event.data.size > 0) {

                    voiceChunks.push(event.data);

                }

            };

            voiceRecorder.onstop = function() {

                const blob = new Blob(voiceChunks, { type: voiceRecorder.mimeType || "audio/webm" });

                const url = URL.createObjectURL(blob);

                audio.src = url;

                audio.hidden = false;

                audio.controls = true;

                result.className = "safe";

                result.innerHTML =

                    "✅ Vocea a fost recunoscută.<br>" +

                    "Tranzacția a fost confirmată (DEMO).";

                if (voiceStream) {

                    voiceStream.getTracks().forEach(track => track.stop());

                }

                isVoiceRecording = false;

                button.textContent = "🎤 Înregistrează mesaj vocal";

            };

            voiceRecorder.start();

            isVoiceRecording = true;

        })

        .catch(() => {

            result.className = "danger";

            result.innerHTML =

                "❌ Accesul la microfon a fost refuzat. Activează permisiunea din browser.";

            button.textContent = "🎤 Înregistrează mesaj vocal";

        });

}