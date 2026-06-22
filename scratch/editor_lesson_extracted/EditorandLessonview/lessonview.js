import axios from "axios";
import {
    convertBlobtofile,
    formatTime,
    getFormattedMediaDuration,
    loaderButton,
    redirectBack,
    renderImage,
    useRedirect,
    isSameDay,
    formatDate,
    waitForImagesToLoad,
    checkisAdminorTeacher,
} from "../utils";
import { flushNodes, handleUpload, initializeplayers } from "../helpers";
initializeplayers();
// not-replying-to-anymessage-default
let messagereplytoId = null;
// document.addEventListener("DOMContentLoaded", function () {
const csrftoken = document.querySelector("input[name=_token]")?.value;
let isprepending = false;
let preservechatboxscrollheight = 0;
const urlString = window.location.href;
const regex = /\/lesson\/(\d+)$/;
const match = urlString.match(regex);
const lessonId = match ? match[1] : null;

const regexcourse = /\/courses\/(\d+)\/lesson/;
const matchcourse = urlString.match(regexcourse);
const courseId = matchcourse ? matchcourse[1] : null;

const chatMessages = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-message");
const fileCorellation =
    document.getElementById("file_correlation")?.innerText || lessonId;

const sendEditedImageReply = async (dataUrl, replyToId) => {
    if (!dataUrl || !replyToId) {
        console.warn("Missing edited image payload or reply target.");
        return;
    }

    try {
        const payloads = {
            image: await convertBlobtofile(
                dataUrl,
                "image",
                "image_edit_reply",
            ),
            replyto: replyToId,
        };

        await axios.post(
            `/courses/${courseId}/lesson/${lessonId}/message`,
            { ...payloads },
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrftoken,
                    "Content-Type": "multipart/form-data",
                },
            },
        );
    } catch (err) {
        console.error("Failed to send edited image reply:", err);
        window.alert("Failed to send edited image reply.");
    } finally {
    }
};
// CHECKING-THE-INITIATOR-IFADMIN/TEACHER
const path = window.location.pathname;
const isAdminOrTeacher = ["/admin", "/teacher"].some((route) =>
    path.startsWith(route),
);
// expose to utils render helper so it can show edit controls
window.isAdminOrTeacher = isAdminOrTeacher;
const start = document.getElementById("StartCall");

// fetching-messages-fro-db
// initializehasmoretobetruean loading to be false
let hasMoremessages = true;
let fetchingload = false;
let messageIds = [];
// chatroom-lock-unlockfeature
let islocked = false;
async function fetchMessages() {
    fetch(`/courses/${courseId}/lesson/${lessonId}/messages`)
        .then((response) => response.json())
        .then((messagesall) => {
            const { hasMore, messages } = messagesall;

            messages.forEach((msgs) => {
                if (msgs?.type === "message") {
                    messageIds.push(msgs.message.id);
                }
            });
            // pulldata to messagearray holder
            // messageholder = messages.messages;
            hasMoremessages = hasMore || false;
            // console.log(messageIds);

            renderMessages(messagesall?.messages);
            // aftermessageisrendered-succesfuly
            setTimeout(async () => {
                await clearunreadReply();
            }, 3000);
        })
        .catch(function (err) {
            // window.alert("Error rendering message");
            console.error("Error getting message", err);
        })
        .finally(function () {
            let ccload = document.querySelector(".fetchingmessageload");
            ccload.style.display = "none";
            // flushNodes(chatMessages);
        });
}

// use-ffect-function
window.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Loaded init ....");

    await Initpage();
    if (start) {
        await checkfoLiveclass();
    }
});

const Initpage = async () => {
    const loaderpre = document.getElementById("loadingAnimationLesson");
    console.log("Lesson Loaded.....");

    // wait-5-secs-for-resources-loading
    let TIMEOUT = 1000;
    setTimeout(() => {
        loaderpre.classList.add("showleshide");
    }, TIMEOUT);
};

const checkfoLiveclass = async () => {
    try {
        const request = await axios.get(`/liveclasscheck`, {
            params: {
                courseid: courseId,
                lessonid: lessonId,
            },
            headers: {
                "X-CSRF-TOKEN": csrftoken,
                Accept: "application/json",
            },
        });
        const { status } = request?.data;
        if (status === "active") {
            if (isAdminOrTeacher) {
                await makeAdminconfirm();
            } else {
                makeJoinvisible();
            }
        } else {
            console.log("No Live class currently");
        }
    } catch (err) {
        console.error("Error fetching details:", err);
    }
};

// when-admin-reload-misatakely-wants-to-confirm-tocontinue
async function makeAdminconfirm() {
    const shouldContinue = confirm(
        "A live session is ongoing. Do you want to continue?",
    );
    if (!shouldContinue) {
        await axios.post(
            `/endlivecall`,
            { cid: courseId, lid: lessonId, isAdminOrTeacher },
            {
                headers: {
                    "X-CSRF-TOKEN": csrftoken,
                },
            },
        );
    } else {
        await startCall();
    }
}
function makeJoinvisible() {
    const parentwrap = document.querySelector("#parent_stu_pr_eve_del");
    if (parentwrap) {
        let joinwrapper = parentwrap.querySelector("#joincall_wrapper");
        joinwrapper.style.display = "block";
    }
}

// text-only-send-button
sendButton?.addEventListener("click", async function (e) {
    // e.stopPropagation();
    // e.preventDefault();
    const message = chatInput.value;
    if (message.trim() === "") {
        alert("No Input to send");
        return;
    }

    try {
        sendButton.setAttribute("disabled", true);
        const response = await fetch(
            `/courses/${courseId}/lesson/${lessonId}/message`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrftoken,
                    Accept: "application/json",
                },
                body: JSON.stringify({ message, replyto: messagereplytoId }),
            },
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send message. Status: ${response.status}`,
            );
        }

        // const data = await response.json();

        // Clear the chat input after sending the message
        chatInput.value = "";

        // Fetch the updated list of messages
        // await fetchMessages();
    } catch (err) {
        window.alert(`Error: ${err.message || "Failed to Send Message"}`);
        console.log(err);
    } finally {
        sendButton.removeAttribute("disabled");
        messagereplytoId = null;
    }
});

// console.log(chatMessages.scrollHeight);

// const renderedDates = new Set();
function renderMessages(messages) {
    const currentUserId = document.querySelector("#curruserid")?.value;

    messages.forEach((messages) => {
        // console.log(message);
        // const messageDate = new Date(message.created_at);

        const messageElement = document.createElement("div");
        let messageContent = document.createElement("div");

        if (messages.type === "separator") {
            const dateKey = messages.date;

            // if (renderedDates.has(dateKey)) return;
            messageContent.classList.add("containerdatesep");
            const dateHeader = document.createElement("div");
            dateHeader.classList.add("date-header");
            dateHeader.dataset.date = messages.date;
            dateHeader.textContent = formatDate(messages.date);
            dateHeader.classList.add("dateSepheaderstyles");
            messageContent.appendChild(dateHeader);
            // renderedDates.add(dateKey);
        } else {
            const { message } = messages;
            // messageIds.push(message?.id);
            // if (!renderedDates.has(dateKey)) {
            //     const dateheadercontainer = document.createElement("div");
            //     dateheadercontainer.classList.add("containerdatesep");
            //     const dateHeader = document.createElement("div");
            //     dateHeader.classList.add("date-header");
            //     dateHeader.textContent = formatDate(message.created_at);
            //     dateHeader.classList.add("dateSepheaderstyles");
            //     dateheadercontainer.appendChild(dateHeader);
            //     chatMessages.appendChild(dateheadercontainer);
            //     if (isprepending) chatMessages.prepend(dateheadercontainer);
            //     else chatMessages.appendChild(dateheadercontainer);
            //     renderedDates.add(dateKey);
            // }

            // if (!renderedDates.has(dateKey)) {
            //     const headerNode = createDateHeader(dateKey);
            //     if (isprepending) chatMessages.prepend(headerNode);
            //     else chatMessages.appendChild(headerNode);
            //     renderedDates.add(dateKey);
            // }

            messageElement.classList.add("message-container");

            messageContent.classList.add("message");
            messageContent.setAttribute("data-index", message?.id);
            messageContent.dataset.createdAt = message?.created_at;

            // destructure-out-message

            // handleUpdateuichatdata(messageElement,message.message,)

            if (message?.message) {
                if (message?.replyto) {
                    let replied_name;
                    if (message.reply_to_body?.user?.id == currentUserId) {
                        replied_name = "You";
                    } else if (
                        checkisAdminorTeacher(
                            message?.reply_to_body?.user?.role,
                        )
                    ) {
                        replied_name = "~ Tutor💡";
                    } else {
                        replied_name = message.reply_to_body?.user?.name;
                    }
                    let builderreply;
                    // check-if-reply-to-isaudio
                    const hasAudio = message?.reply_to_body.audio != null;

                    const hasImage = message?.reply_to_body.image != null;

                    if (hasAudio) {
                        const audioEl = message?.reply_to_body.audio;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `
                    <div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                    <div>
                        ${`<p>${replied_name || ""}</p>`}
                    </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">Audio</div>
                            <div id = 'audiolegthduration'>...</div>
                        </div>
                    </div>
                    <div style = "text-align:left;padding:1px" id = "rep_txt">${
                        message?.message || ""
                    }</div>
                    </div>
                    `;
                        messageContent.appendChild(builderreply);

                        if (audioEl) {
                            getFormattedMediaDuration(audioEl)
                                .then((duration) => {
                                    const durationDiv =
                                        builderreply.querySelector(
                                            "#audiolegthduration",
                                        );
                                    if (durationDiv) {
                                        durationDiv.textContent = duration;
                                    }
                                })
                                .catch((error) => {
                                    console.error(
                                        "Error fetching audio duration:",
                                        error,
                                    );
                                    const durationDiv =
                                        builderreply.querySelector(
                                            "#audiolegthduration",
                                        );
                                    if (durationDiv) {
                                        durationDiv.textContent = "...";
                                    }
                                });
                        }
                    } else if (hasImage) {
                        const imageSrc = message?.reply_to_body.image;
                        const imgtxtt = message?.reply_to_body?.image_text;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `
                    <div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                    <div>
                        ${`<p>${replied_name || "~user"}</p>`}
                    </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${imgtxtt || "image"}</div>
                            <div id = 'image_rep'><img src = ${
                                imageSrc || ""
                            }  style= "width: 50px; height:30px;"></div>
                        </div>
                    </div>
                    <div style = "text-align:left;padding:1px" id = "rep_txt">${
                        message?.message || ""
                    }</div>
                    </div>
                    `;
                        messageContent.appendChild(builderreply);
                    } else {
                        const replied_text = message?.reply_to_body?.message;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `<div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                        <div>
                            ${`<p>${replied_name || `<i>~user</i>`}</p>`}
                        </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${replied_text || ""}</div>
                        </div>
                    </div>
                        <div style = "text-align:left;padding:1px" id = "rep_txt">${
                            message?.message || `<i>message</i>`
                        }</div>
                    </div>
                `;
                    }
                    messageContent.appendChild(builderreply);
                    builderreply
                        .querySelector("[data-reply-to]")
                        .addEventListener("click", () => {
                            const targetMessage = document.querySelector(
                                `[data-index="${message?.replyto}"]`,
                            );
                            if (targetMessage) {
                                targetMessage.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });

                                const parentEl =
                                    targetMessage.closest(".message-container");

                                parentEl.classList.add("highlight_current_msg");

                                setTimeout(() => {
                                    parentEl.classList.remove(
                                        "highlight_current_msg",
                                    );
                                }, 3000);
                            } else {
                                chatMessages.scrollTop = 0;
                            }
                        });
                } else {
                    messageContent.innerHTML = `<div id = "msg_text">${
                        message?.message || ``
                    }</div>`;
                }
            } else if (message?.audio) {
                let aud = document.createElement("audio");
                aud.setAttribute("controls", "true");
                aud.setAttribute("playsinline", "true");
                aud.setAttribute("src", `${message?.audio}`);
                aud.setAttribute("preload", "metadata");
                aud.classList.add("audio_chat_style");

                if (message?.replyto) {
                    let builderreply;
                    const hasAudio = message?.reply_to_body?.audio != null;

                    const hasImage = message?.reply_to_body?.image != null;
                    const replied_name = message?.reply_to_body?.user?.name;

                    if (hasAudio) {
                        const audioEl = message?.reply_to_body?.audio;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `
                    <div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                    <div>
                        ${`<p>${replied_name || ""}</p>`}
                    </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">Audio</div>
                            <div id = 'audiolegthduration'>...</div>
                        </div>
                    </div>
                    <div style = "text-align:left;padding:1px" id = "rep_audio">
                        <div class="pt-1">
                            <audio
                                src="${message?.audio || ""}"
                                class="audio_chat_style"
                                preload="metadata"
                                controls
                                playsinline
                            ></audio>
                        </div>
                    </div>
                    </div>
                `;
                        messageContent.appendChild(builderreply);
                        if (audioEl) {
                            getFormattedMediaDuration(audioEl)
                                .then((duration) => {
                                    const durationDiv =
                                        builderreply.querySelector(
                                            "#audiolegthduration",
                                        );
                                    if (durationDiv) {
                                        durationDiv.textContent = duration;
                                    }
                                })
                                .catch((error) => {
                                    console.error(
                                        "Error fetching audio duration:",
                                        error,
                                    );
                                });
                        }
                    } else if (hasImage) {
                        // audio-reply-to-image-being-sent
                        const imageSrc = message?.reply_to_body?.image;
                        const imgtxtt = message?.reply_to_body?.image_text;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `<div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                    <div>
                        ${`<p>${replied_name || ""}</p>`}
                    </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${imgtxtt || ""}</div>
                            <div id = 'image_rep'><img src = ${
                                imageSrc || ""
                            }  style= "width: 50px; height:30px;"></div>
                        </div>
                    </div>
                    <div style = "text-align:left;padding:1px" id = "rep_audio">
                        <div class="pt-1">
                            <audio
                                src="${message?.audio || ""}"
                                class="audio_chat_style"
                                preload = "metadata"
                                controls
                                playsinline
                            ></audio>
                        </div>
                    </div>
                    </div>`;
                        messageContent.appendChild(builderreply);
                    } else {
                        builderreply = document.createElement("div");
                        const replied_text = message?.reply_to_body?.message;
                        builderreply.innerHTML = `<div> 
                     <div class = 'repbly_buid ${
                         message.user_id == currentUserId && "mine_replyto"
                     }' data-reply-to="${message?.replyto}">
                        <div>
                            ${`<p>${replied_name || ""}</p>`}
                        </div>
                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${replied_text || ""}</div>
                        </div>
                    </div>
                        <div style = "text-align:left;padding:1px" id = "rep_audio">
                        <div class="pt-1">
                            <audio
                                src="${message?.audio || ""}"
                                class="audio_chat_style"
                                preload = "metadata"
                                controls
                                playsinline
                            ></audio>
                        </div>
                    </div>
                    </div>
                    `;
                        messageContent.appendChild(builderreply);
                    }
                    builderreply
                        .querySelector("[data-reply-to]")
                        .addEventListener("click", () => {
                            const targetMessage = document.querySelector(
                                `[data-index="${message?.replyto}"]`,
                            );
                            if (targetMessage) {
                                targetMessage.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });

                                const parentEl =
                                    targetMessage.closest(".message-container");

                                parentEl.classList.add("highlight_current_msg");

                                setTimeout(() => {
                                    parentEl.classList.remove(
                                        "highlight_current_msg",
                                    );
                                }, 3000);
                            }
                        });
                } else {
                    messageContent.prepend(aud);
                }
            } else if (message?.image) {
                let imageEl = document.createElement("img");
                let imgcon = document.createElement("div");

                imageEl.setAttribute("src", message?.image);
                imageEl.setAttribute("loading", "lazy");
                imageEl.classList.add("image_sent_style");
                imgcon.appendChild(imageEl);
                renderImage(imageEl, {
                    replyToId: message?.id,
                    onEditSave: async ({ dataUrl, replyToId }) => {
                        await sendEditedImageReply(
                            dataUrl,
                            replyToId ?? message?.id,
                        );
                    },
                });
                if (message?.replyto) {
                    // deprecated-grab-message-selector
                    // const grabmessage = document.querySelector(
                    //     `[data-index="${message?.replyto}"]`
                    // );
                    let builderreply;
                    // check-if-reply-to-isaudio
                    const hasAudio = message?.reply_to_body?.audio != null;

                    const hasImage = message?.reply_to_body?.image != null;

                    const replied_name = message?.reply_to_body?.user?.name;

                    if (hasAudio) {
                        const audioEl = message?.reply_to_body?.audio;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `<div>
                         <div class = 'repbly_buid ${
                             message.user_id == currentUserId && "mine_replyto"
                         }' data-reply-to="${message?.replyto}">

                        <div>
                            ${`<p>${replied_name || ""}</p>`}
                        </div>
                            <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">Audio</div>
                            <div id = 'audiolegthduration'>...</div>
                            </div>
                        </div>
                    </div>
                    `;

                        messageContent.appendChild(builderreply);
                        // get-audio-length
                        if (audioEl) {
                            getFormattedMediaDuration(audioEl)
                                .then((duration) => {
                                    const durationDiv =
                                        builderreply.querySelector(
                                            "#audiolegthduration",
                                        );
                                    if (durationDiv) {
                                        durationDiv.textContent = duration;
                                    }
                                })
                                .catch((error) => {
                                    console.error(
                                        "Error fetching audio duration:",
                                        error,
                                    );
                                });
                        }
                    } else if (hasImage) {
                        const imageSrc = message?.reply_to_body?.image;
                        const imgtxtt = message?.reply_to_body?.image_text;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `<div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                    <div>
                        ${`<p>${replied_name || ""}</p>`}
                    </div>
                     <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${imgtxtt || "Photo"}</div>
                            <div id = 'image_rep'><img src = ${
                                imageSrc || ""
                            }  style= "width: 50px; height:30px;"></div>
                        </div>
                    </div>
                    `;
                        messageContent.appendChild(builderreply);
                    } else {
                        const replied_text = message?.reply_to_body?.message;
                        builderreply = document.createElement("div");
                        builderreply.innerHTML = `<div>
                    <div class = 'repbly_buid ${
                        message.user_id == currentUserId && "mine_replyto"
                    }' data-reply-to="${message?.replyto}">
                        <div>
                            ${`<p>${replied_name || ""}</p>`}
                        </div>

                        <div style = "display:flex;justify-content:space-between;overflow:hidden">
                            <div id = "rep_txt">${replied_text || ""}</div>
                        </div>
                    </div>    
                    `;
                        messageContent.appendChild(builderreply);
                    }
                    builderreply
                        .querySelector("[data-reply-to]")
                        .addEventListener("click", () => {
                            const targetMessage = document.querySelector(
                                `[data-index="${message?.replyto}"]`,
                            );
                            if (targetMessage) {
                                targetMessage.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                });

                                const parentEl =
                                    targetMessage.closest(".message-container");

                                parentEl.classList.add("highlight_current_msg");

                                setTimeout(() => {
                                    parentEl.classList.remove(
                                        "highlight_current_msg",
                                    );
                                }, 3000);
                            }
                        });
                }

                messageContent.append(imgcon);
                messageContent.classList.add("is_contain_image");
            }

            const subcontent = document.createElement("div");
            subcontent.classList.add("bottom_text_cont");
            subcontent.textContent = `${formatTime(message?.created_at)}`;

            let append_bottom = null;
            if (message?.image_text) {
                append_bottom = document.createElement("div");
                const imgtext = document.createElement("div");
                imgtext.className = "bottom_img_istext";
                imgtext.innerHTML = `${message.image_text}`;
                append_bottom.className = "bottom_image_txt_cont";
                append_bottom.appendChild(imgtext);
                append_bottom.appendChild(subcontent);
            }

            if (message.user_id == currentUserId) {
                messageContent.classList.add("my-message");
                const username = message?.user?.name;
                let detailsarea = document.createElement("div");
                const moreiconwrapper = document.createElement("div");
                detailsarea.className = "details_flex_area";
                detailsarea.style.justifyContent = "flex-end";
                detailsarea.style.height = `15px`;
                let showname = `<p class = "username_mssg" style = 'visibilty:hidden;display:none'>You</p>`;
                detailsarea.innerHTML = showname;
                messageContent.prepend(detailsarea);
                subcontent.innerHTML = `${formatTime(
                    message?.created_at,
                )}<span style = "margin-left: 3px"><i class="fa fa-check" aria-hidden="true"></i>
                </span>`;
                moreiconwrapper.innerHTML = `
                <div id = "action_click_message" data-bs-toggle="dropdown"><i class="fa-solid fa-angle-down" style="font-size: 1.2rem"></i></div>
           
                <div aria-labelledby = "action_click_message"  class="dropdown-menu" id = "more_message">
                 <li>
                    <div id="reply_message_button" class="dropdown-item" style="cursor: pointer">
                        Reply
                    </div>
                </li>
                  <li> 
                    <hr class="dropdown-divider">
                    </li>

                    <li>
                        <div id="delete_message_button" class="dropdown-item" style="cursor: pointer">
                            Delete
                        </div>
                    </li>
                </div>`;
                detailsarea.appendChild(moreiconwrapper);
            } else {
                messageContent.classList.add("other-message");
                const username = message?.user?.name;
                let id = message?.user?.id;
                let detailsarea = document.createElement("div");
                detailsarea.className = "details_flex_area";
                detailsarea.innerHTML =
                    message?.user?.role === "admin" ||
                    message?.user?.role === "teacher"
                        ? `<a href = "/users?userid=${id}" class = "username_mssg">~ Tutor💡</a>`
                        : `<a href = "/users?userid=${id}"class = "username_mssg">~ ${username}</a>`;
                messageContent.prepend(detailsarea);
                const moreiconwrapper = document.createElement("div");
                // moreicon.setAttribute('id', 'moremessageicon')
                // moreicon.innerHTML = ``
                moreiconwrapper.innerHTML = `
            <div id = "action_click_message" data-bs-toggle="dropdown"><i class="fa-solid fa-angle-down" style="font-size: 1.2rem"></i></div>

            <div aria-labelledby = "action_click_message"  class="dropdown-menu" id = "more_message">
                <li>
                    <div id="reply_message_button" class="dropdown-item" style="cursor: pointer">
                        Reply
                    </div>
                </li>
               
                ${
                    isAdminOrTeacher
                        ? `
                    <li> 
                    <hr class="dropdown-divider">
                    </li>
                    <li>
                    <div id="delete_message_button" class="dropdown-item" style="cursor: pointer">
                        Delete
                    </div>
                </li>`
                        : ""
                }
            </div>
            `;

                detailsarea.appendChild(moreiconwrapper);
            }
            if (message?.image_text) {
                messageContent.appendChild(append_bottom);
            } else {
                messageContent.appendChild(subcontent);
            }
        }

        messageElement.appendChild(messageContent);

        if (isprepending) {
            chatMessages.prepend(messageElement);
        } else {
            chatMessages.appendChild(messageElement);
        }
    });
    // console.log(chatMessages.scrollHeight);
    // console.log(chatMessages.scrollTop);
    // scroll -to the-bottom-of the cntainer
    if (isprepending) {
        // if-it-contains-imageswait-before-scrollingto-section
        waitForImagesToLoad(chatMessages).then(() => {
            let newmessageheight = chatMessages.scrollHeight;

            // do-like-nothing-happened-UI

            chatMessages.scrollTop +=
                newmessageheight - preservechatboxscrollheight;
            console.log("adjustedheight=>", chatMessages.scrollHeight);
            // update-the-chatmessageheight
            preservechatboxscrollheight = newmessageheight;
        });
    } else {
        preservechatboxscrollheight = chatMessages.scrollHeight;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // console.log("normheight=>", preservechatboxscrollheight);
    }
}

// MESASAGES-LAZYLOAD-PAGINATIONS-HERE
const paginateloader = document.createElement("div");
paginateloader.innerHTML = ` <div             class="lazyloadingpaginate">
 <img src="/images/Loader.gif" alt="stream-loading" style="width: 45px; height: 45px;">
</div>`;
chatMessages?.addEventListener("scroll", async () => {
    // check-if-user-hasreached-thetip/top-ofthemessagearea
    // also if it has moremessages and loading is initialzed

    if (chatMessages.scrollTop === 0 && hasMoremessages && !fetchingload) {
        chatMessages.prepend(paginateloader);
        fetchingload = true;
        // paginateloader.style.display = "flex";
        // now-weneed-tograbtout-thefirst-message in the afterMain.e th id and passed as a aqeury to lastfetched
        // const firstinStack = messageholder[0]?.id;
        // const firstinStack = chatMessages.querySelector(".message");
        // console.log();
        const firststackindex = messageIds[0];

        try {
            const reqpaginate = await axios.get(
                `/courses/${courseId}/lesson/${lessonId}/messages?lastfetched=${firststackindex}`,
            );
            if (reqpaginate.status == 200) {
                const { data } = reqpaginate;
                hasMoremessages = data.hasMore;
                // console.log("h", hasMoremessages);
                const messagelists = data.messages;

                // return;
                if (messagelists.length > 0) {
                    let newmesid = [];
                    messagelists.forEach((msgs) => {
                        if (msgs?.type === "message") {
                            newmesid.unshift(msgs.message.id);
                        }
                    });
                    newmesid.reverse();
                    messageIds = [...newmesid, ...messageIds];
                    // helpwrfunction-to-prepend-messages
                    isprepending = true;
                    // console.log(messageIds);
                    renderMessages(messagelists.reverse());
                    deduplicateDateSeparators();
                }
            }
            // console.log(reqpaginate);
        } catch (err) {
            // fails-silently
            console.error("Failed to load more messages");
        } finally {
            chatMessages.removeChild(paginateloader);
            fetchingload = false;
        }
    }
});

// fetch-automatically-whenpageis-loaded
async function initmessage() {
    await fetchMessages();
}
initmessage();

function deduplicateDateSeparators() {
    const headers = document.querySelectorAll(".date-header");

    const dateGroups = new Map();
    let firstPreservedHeader = null;
    headers.forEach((header) => {
        const date = header.dataset.date;

        if (!dateGroups.has(date)) {
            dateGroups.set(date, []);
        }

        dateGroups.get(date).push(header);
    });

    // Remove all duplicates, keeping only the first
    dateGroups.forEach((headersArray) => {
        if (headersArray.length > 1) {
            headersArray.slice(1).forEach((dup) => {
                const container = dup.closest(".containerdatesep"); // assuming this wraps the header
                if (container) container.remove();
                else dup.remove(); // fallback if container is missing
            });
        }
    });
}

// 2. Get the first visible message's date to prevent duplicate date headers

// mixins-variable-utility-purpose
let audioRecorder;
let audioChunks = [];
let stop = false;
const audiosignal = document.querySelector(".audio-signal");
const cancelrecord = document.querySelector("#cancel_record");
const stopbtn = document.querySelector("#stop_record");
const record_text = document.getElementById("record_text");
const record_wave = document.getElementById("record_wave");
// audioelement placeholder
let audioEl;
const recordSendbutton = document.querySelector("#send_audio_record");

// disable-sendbtn
recordSendbutton.disabled = true;
// cancle-trigeers-cancel-all
cancelrecord.onclick = function () {
    cancelRecording();
};
// utlity-cancel-record func
function cancelRecording() {
    audioRecorder.stop();
    stop = false;
    audiosignal.style.display = "none";
    // clean_ups_after_canceled
    if (audiosignal.classList.contains("after_rec_style")) {
        audiosignal.classList.remove("after_rec_style");
        audiosignal.removeChild(audioEl);
        record_text.style.display = "block";
        record_wave.style.display = "block";
        document.getElementById("audio_data").value = "";
    }
}

// stope_record
stopbtn.onclick = function () {
    stopButtonrecording();
};

// utility-stop-record-func
function stopButtonrecording() {
    if (audioRecorder && audioRecorder.state === "recording") {
        stop = true;
        console.log("trigger");
        audioRecorder.stop();
        recordSendbutton.disabled = false;
    }
}

// audio-button_clicked_for-audios-only-tostart-audio
document.getElementById("audio_btn_record").onclick = async () => {
    recordSendbutton.disabled = true;
    if (audioRecorder && audioRecorder.state === "recording") {
        audioRecorder.stop();
    } else {
        // call-audio-signal
        audiosignal.style.display = "flex";
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        // TODO:USING-MPG-TRICK-FORCROSS-PLATFORM-SUPPORTS-ESPECIALLY-ON-IOS-DEVICES
        // try {
        //     audioRecorder = new MediaRecorder(stream, {
        //         mimeType: "audio/webm",
        //     });
        // } catch (err) {
        //     // ios-fallbacks
        //     try {
        //         audioRecorder = new MediaRecorder(stream, {
        //             mimeType: "video/mp4",
        //         });
        //     } catch (err2) {
        //         alert("Error No MImetype supported!");
        //         return;
        //     }
        // }
        try {
            audioRecorder = new MediaRecorder(stream, {
                mimeType: "video/mp4",
            });
        } catch (err) {
            console.error("Error No MImetype supported!");
            return;
        }

        // then-push-toaudio-chunks-as-aprts
        audioRecorder.ondataavailable = (e) => {
            //    spread-the-previous-
            audioChunks.push(e.data);
        };

        audioRecorder.onstop = async () => {
            // chec-if-its-the-pause-btn
            if (!stop) {
                return;
            } else {
                audioEl = document.createElement("audio");
                record_text.style.display = "none";
                record_wave.style.display = "none";
                const blobfile = new Blob(audioChunks, {
                    type: audioRecorder.mimeType,
                });
                // clear-audio-chunks
                audioChunks = [];

                // const mpgConvert = await convertToMP4
                // const convertedaudio = await convertWebMToAAC(blobfile);

                const audiourl = URL.createObjectURL(blobfile);

                audioEl.setAttribute("src", audiourl);
                audioEl.setAttribute("controls", "true");
                audioEl.setAttribute("playsinline", "true");
                audioEl.classList.add("audo_rec_file");
                console.log(audioEl);
                audiosignal.classList.add("after_rec_style");
                audiosignal.prepend(audioEl);
            }
        };

        audioRecorder.start();
    }
};

// get_record_button_func

// function_to_send_audio_content
recordSendbutton?.addEventListener("click", async () => {
    // perform-stop_func_first_to_follow_theprocess

    // stopButtonrecording();
    // query-for-hidden-audio-input
    const recordFile = document
        ?.querySelector(".audo_rec_file")
        ?.getAttribute("src");
    // console.log(recordFile);

    // structured_objrct_forms
    const formobj = {
        audio: await convertBlobtofile(recordFile, "audio", fileCorellation),
        replyto: messagereplytoId,
    };
    // console.log(formobj);

    // type-conditional_call_onlyif thereis a recorded file
    if (recordFile && recordFile.src !== "") {
        try {
            recordSendbutton.setAttribute("disabled", true);
            // console.log(formobj);
            await axios.post(
                `/courses/${courseId}/lesson/${lessonId}/message`,
                { ...formobj },
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN": csrftoken,
                        "Content-Type": "multipart/form-data",
                    },
                },
            );
            chatInput.value = "";
            cancelRecording();
            // deprecated-pooling-method:
            // then-refetch-messages
            // await fetchMessages();
        } catch (err) {
            console.log(`Erro${err}`);
        } finally {
            recordSendbutton.removeAttribute("disabled");
            messagereplytoId = null;
        }
    } else {
        window.alert("No input to send");
    }
});

// add-assessment-button
const addassessmentBtn = document.querySelectorAll("#add_assessment_btn");
addassessmentBtn.forEach((addassessmentBtn) => {
    const text = addassessmentBtn?.textContent;
    addassessmentBtn.onclick = function () {
        if (text === "Manage Assessment") {
            window.open(useRedirect("assessment"), "_self");
        } else if (text === "Add Assessment") {
            window.open(useRedirect("create-assessments"), "_self");
            // for-students-view
        } else if (text === "Take Assessment") {
            window.open(useRedirect("take-assessment"), "_self");
        } else if (text === "Take Test") {
            window.open(useRedirect("take-assessment"), "_self");
        }
    };
});

start?.addEventListener("click", function () {
    startCall();
});

// const joinBtn = document?.getElementById("join_call");
// joinBtn.onclick = function () {
//     joinClass();
// };
const loadingElement = document.querySelector("#loadingAnimation");
let CHANNEL_NAME = `GroupClassChart_${courseId}_${lessonId}`;
const endCallvid = document.querySelector("#end_call");
const videoCalllayout = document.querySelector("#video_class_layout");
const spreadmedias = document.querySelector("#media_uploaded");
const showvideocall = () => {
    videoCalllayout.style.display = "block";
};

const closeVideocall = () => {
    videoCalllayout.style.display = "none";
};
function showstreamload() {
    loadingElement.classList.add("show_stream");
}

function closeLoading() {
    loadingElement.classList.remove("show_stream");
}

// Remove existing elements
function removeElements() {
    spreadmedias.style.display = "none";
}

// add-existing-element
function addElements() {
    spreadmedias.style.display = "block";
}

// algora.io-setup-init
var client = AgoraRTC.createClient({
    mode: "live",
    codec: "vp8",
});
var localTracks = {
    videoTrack: null,
    audioTrack: null,
};
var remoteUsers = {};
var options = {
    appid: import.meta.env.VITE_AGORA_APP_ID,
    channel: null,
    uid: null,
    token: null,
    role: "audience",
};

const toggleMic = document.getElementById("toggleaudio");
const togglevid = document.getElementById("togglevideo");

// Start the call
async function startCall() {
    showstreamload();
    // collapselock-toshow area
    islocked && (islocked = false);
    reverseuiifvideoempty(false);
    try {
        const response = await fetch("/admin/video_token/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrftoken,
                Accept: "application/json",
            },
            body: JSON.stringify({
                channel_name: CHANNEL_NAME,
                cid: courseId,
                lid: lessonId,
                isAdminOrTeacher,
            }),
        });

        const { token, uid } = await response.json();
        if (!token) {
            throw new Error("Failed to generate token!");
        }

        options.token = token;
        options.uid = uid;
        options.channel = CHANNEL_NAME;
        options.role = "host";

        await join();
    } catch (error) {
        console.error("Error in startCall:", error);
        closeLoading();
        alert("Failed to start call");
    }
}

function reverseuiifvideoempty(hasend) {
    const viwemedia = document.getElementById("media_uploaded");
    const viewinterface = document.querySelector(".media_lesson_interface");
    const lessvidpresent = document.getElementById("lessvidpresent");
    if (lessvidpresent) {
        if (hasend) {
            viwemedia.style.height = "0vh";
            viewinterface.style.height = "0vh";
        } else {
            viwemedia.style.height = "70vh";
            viewinterface.style.height = "70vh";
        }
    }
}

// clear reply -unred after viewd
const clearunreadReply = async () => {
    try {
        const response = await axios.post(
            `/courses/${courseId}/lesson/${lessonId}/message/clearreplycount`,
            {},
            {
                headers: {
                    "X-CSRF-TOKEN": csrftoken,
                    Accept: "application/json",
                },
            },
        );
        if (response.status === 200) {
            console.log(response?.data || "Reply cleared successfully");
        }
    } catch (error) {
        // fail silently
        console.error("Error clearing reply:", error);
    }
};

// Join the class
async function joinClass() {
    showstreamload();
    try {
        const response = await fetch("/admin/video_token/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrftoken,
            },
            body: JSON.stringify({
                channel_name: CHANNEL_NAME,
                cid: courseId,
                lid: lessonId,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Network response was not ok: ${response.statusText}`,
            );
        }

        const { token, uid } = await response.json();
        console.log(token, uid);

        options.token = token;
        options.uid = uid;
        options.channel = CHANNEL_NAME;
        // make-both-host
        options.role = "host";

        await join();
    } catch (error) {
        console.error(error);
    }
}

// Join channel and set up streams
async function join() {
    // Set client role
    if (options.role === "audience") {
        await client.setClientRole(options.role);
    } else {
        await client.setClientRole(options.role);
    }

    // Add event listeners for remote users
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    // Join the channel
    options.uid = await client.join(
        options.appid,
        options.channel,
        options.token || null,
        options.uid || null,
    );

    if (options.role === "host") {
        // Create and publish local tracks
        if (!localTracks.audioTrack) {
            localTracks.audioTrack =
                await AgoraRTC.createMicrophoneAudioTrack();
        }
        if (!localTracks.videoTrack) {
            localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        }
        // Play the local video track
        const localPlayerContainer = document.createElement("div");
        localPlayerContainer.id = `local-player-${options.uid}`;
        localPlayerContainer.style.width = "100%";
        localPlayerContainer.style.height = "100%";
        localPlayerContainer.classList.add("local_styled_video");
        document.getElementById("local-video").append(localPlayerContainer);
        localTracks.videoTrack.play(localPlayerContainer);
        await client.publish(Object.values(localTracks));
        console.log("Local tracks published");
    } else if (options.role === "audience") {
        console.log("Joined as audience, waiting for host to publish streams.");
    }

    closeLoading();
    removeElements();
    showvideocall();
    hidecallbuttons();
}

function hidecallbuttons() {
    const stbtn = document.getElementById("StartCall");
    stbtn && stbtn.setAttribute("disabled", "disabled");
    const dcall = document.getElementById("joincallstudent");
    dcall && dcall.setAttribute("disabled", "disabled");
}

function unhidecallbuttons() {
    const stbtn = document.getElementById("StartCall");
    stbtn && stbtn.removeAttribute("disabled");
    const dcall = document.getElementById("joincallstudent");
    dcall && dcall.removeAttribute("disabled");
}

endCallvid.onclick = function () {
    leave();
};
async function endactivecall() {
    if (isAdminOrTeacher) {
        try {
            const request = await axios.post(
                `/endlivecall`,
                {
                    cid: courseId,
                    lid: lessonId,
                    isAdminOrTeacher,
                },
                {
                    headers: {
                        "X-CSRF-TOKEN": csrftoken,
                        Accept: "application/json",
                    },
                },
            );

            if (request.status !== 200) {
                throw new Error(`Error ending call`);
            }
        } catch (err) {
            console.error(err);
        }
    }
}
// Leave the channel
async function leave() {
    reverseuiifvideoempty(true);
    for (let trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = undefined;
        }
    }

    // Remove remote users and player views
    remoteUsers = {};
    document.getElementById("remote-video").innerHTML = "";

    // Leave the channel
    await client.leave();
    closeVideocall();
    addElements();

    console.log("Client left channel");
    await endactivecall();
    unhidecallbuttons();
}

let mute = true;
toggleMic?.addEventListener("click", async () => {
    const previcon = toggleMic?.querySelector(".fa-solid");
    if (mute) {
        previcon.classList.replace("fa-microphone", "fa-microphone-slash");
        // mute-theloca-streamer
        if (localTracks) {
            const { audioTrack } = localTracks;
            await audioTrack.setMuted(false);
        }
    } else {
        previcon.classList.replace("fa-microphone-slash", "fa-microphone");
        await localTracks.audioTrack.setMuted(true);
    }

    mute = !mute;
});

// same-logic-for-video-toggle
let vid = true;
togglevid?.addEventListener("click", async () => {
    const previcon = togglevid?.querySelector(".fa-solid");
    if (vid) {
        previcon.classList.replace("fa-video", "fa-video-slash");
        // vid-toggle-theloca-streamer
        if (localTracks) {
            const { videoTrack } = localTracks;
            await videoTrack.setEnabled(false);
            console.log("Video disabled");
        }
    } else {
        previcon.classList.replace("fa-video-slash", "fa-video");
        await localTracks.videoTrack.setEnabled(true);
        console.log("Video enabled");
    }

    vid = !vid;
});
// Subscribe to remote user
async function subscribe(user, mediaType) {
    const uid = user.uid;
    // Subscribe to a remote user
    await client.subscribe(user, mediaType);
    console.log("subscribe success");

    if (mediaType === "video") {
        const playerContainer = document.createElement("div");
        playerContainer.id = `remote-player-${uid}`;
        playerContainer.style.width = "100%";
        playerContainer.style.height = "100%";
        document.getElementById("remote-video").append(playerContainer);

        user.videoTrack.play(playerContainer);
    }
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
}

// Handle remote user published
function handleUserPublished(user, mediaType) {
    console.log('"user-published" event for remote users is triggered.');
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user, mediaType);
}

// Handle remote user unpublished
function handleUserUnpublished(user) {
    console.log('"user-unpublished" event for remote users is triggered.');
    const id = user.uid;
    delete remoteUsers[id];
    const remotePlayerContainer = document.getElementById(
        `remote-player-${id}`,
    );
    if (remotePlayerContainer) {
        remotePlayerContainer.remove();
    }
}

// view-lesson_attendance-shets
const attendacebtn = document.querySelectorAll("#attendance_view");
const backbutton = document.querySelector("#backbtn");

attendacebtn.forEach((attendacebtn) => {
    attendacebtn?.addEventListener("click", () => {
        window.open(useRedirect("view-attendance"), "_self");
    });
});

const computeScorebtn = document.querySelectorAll("#compute_score");

computeScorebtn.forEach((computebtn) => {
    computebtn?.addEventListener("click", () => {
        window.open(useRedirect("computescores"), "_self");
    });
});

backbutton.onclick = function () {
    const roletype = document.getElementById("is_n_role")?.textContent;

    if (roletype === "admin") {
        window.open(
            `${window.location.origin}/admin/courses/${courseId}`,
            "_self",
        );
    } else if (roletype === "teacher") {
        window.open(
            `${window.location.origin}/teacher/courses/${courseId}`,
            "_self",
        );
    } else if (roletype === "student") {
        window.open(`${window.location.origin}/courses/${courseId}`, "_self");
    } else {
        window.open(`${window.location.origin}/courses/${courseId}`, "_self");
    }
};

// if-the-lesso-has-utube-vider-then-play
const lessonutube = document.getElementById("video_utube_cnt");

if (lessonutube) {
    const vidid = lessonutube.getAttribute("data-attribute");

    // embed-iframe

    const appenderlesson = document.createElement("div");
    appenderlesson.className = "plyr__video-embed";
    appenderlesson.setAttribute("id", "player");
    const iframeHTML = `<iframe width="100" height="100" 
                    src="https://www.youtube.com/embed/${vidid}?origin=https://plyr.io&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1" 
                    allowfullscreen
                    allowtransparency
                    allow="autoplay"
                    >
                </iframe>`;
    appenderlesson.innerHTML = iframeHTML;

    try {
        lessonutube.appendChild(appenderlesson);
        const player = new Plyr(appenderlesson, {
            youtube: {
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                dnt: true, // Disable tracking
                byline: false, // Disable author name
                title: false,
            },
        });
    } catch (err) {
        console.error("Error embeding link");
    }
}

const formSubmits = document.querySelectorAll("form");

formSubmits.forEach((formb) => {
    formb.addEventListener("submit", function (ev) {
        const submtbtn = formb.querySelector('button[type="submit"]');
        loaderButton.defaultisLoad(submtbtn);
    });
});

// image-add-modal
const imageModal = new bootstrap.Modal(
    document.getElementById("insertimageModal"),
);
const sendImagebtn = document.getElementById("insert_image_call");
sendImagebtn?.addEventListener("click", () => {
    imageModal.show();
});
const wrapper_uploaded = document.getElementById("image_display_conta");

// upload_image_exact
const updImgsendbtn = document.getElementById("upload_buttonsend_image");
updImgsendbtn?.addEventListener("change", (e) => {
    // flush-container
    flushNodes(wrapper_uploaded);
    let src = e.target.files[0];
    // console.log(src);
    if (src && src.type.startsWith("image/")) {
        handleUpload("image", src, wrapper_uploaded);
    } else {
        window.alert("file type not supported");
        return;
    }
});

const sendBtnImage = document.querySelector("#clicker_send_image");
sendBtnImage?.addEventListener("click", async () => {
    const imagesendtext = document.querySelector("#image_text_sent");
    const imageFile = wrapper_uploaded
        ?.querySelector("img")
        ?.getAttribute("src");

    if (!imageFile) {
        window.alert("image File is required!");
        return;
    }

    const payloads = {
        image_text: imagesendtext?.value || "",
        image: await convertBlobtofile(imageFile, "image", "image_message"),
        replyto: messagereplytoId,
    };

    // console.log(payloads);
    try {
        loaderButton.defaultisLoad(sendBtnImage);
        await axios.post(
            `/courses/${courseId}/lesson/${lessonId}/message`,
            { ...payloads },
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrftoken,
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        flushNodes(wrapper_uploaded);
        imagesendtext.value = "";

        // await fetchMessages();
    } catch (err) {
        let statuscode = err?.response?.status;
        if (statuscode === 422) {
            window.alert("Image File is greater than 10mb");
        } else {
            window.alert("failed to send message");
        }
        console.error(err);
    } finally {
        loaderButton.defaultNoload(sendBtnImage);
        imageModal.hide();
        messagereplytoId = null;
    }
});

// event-deligation
document.querySelector("#chat-box").addEventListener("click", async (event) => {
    if (event.target && event.target.id === "reply_message_button") {
        let ele = event.target;
        const parengrab = ele.closest(".message");
        messagereplytoId = parengrab?.getAttribute("data-index");
        showReplyAlert();
    }
});
// event-deligation-for-delete
document.querySelector("#chat-box").addEventListener("click", async (event) => {
    if (event.target && event.target.id === "delete_message_button") {
        // confirm-first
        if (!window.confirm("Are you sure You want to delete this Message")) {
            return;
        }
        let ele = event.target;
        const parengrab = ele.closest(".message");
        const messagedelindex = parengrab?.getAttribute("data-index");

        try {
            const request = await axios.delete(
                // only-courseisandlessonid-slug-is rendundat and only needed for middlewares
                // sincemessageinex-isunique
                `/courses/${courseId}/lesson/${lessonId}/message/${messagedelindex}`,
                {
                    headers: {
                        "X-CSRF-TOKEN": csrftoken,
                        Accept: "application/json",
                    },
                },
            );
            if (request.status === 403) {
                throw new Error("Permission Denied");
            } else if (request.status === 200) {
                window.alert("Message deleted successfully");
                removemessagefromUi(messagedelindex);
            }
        } catch (err) {
            console.error(err);
            window.alert("Failed to delete message");
        }
    }
});

const removemessagefromUi = (messageid) => {
    const messageNode = document.querySelector(`[data-index="${messageid}"]`);
    if (messageNode) {
        messageNode.remove();
    }
};

const buttonjoin = document.querySelector("#parent_stu_pr_eve_del");
if (buttonjoin) {
    buttonjoin.addEventListener("click", (event) => {
        if (event.target && event.target.id === "joincallstudent") {
            // joinClass();
            startCall();
        }
    });
}

function showReplyAlert() {
    const alertDiv = document.createElement("div");
    alertDiv.id = "replyAlert";
    alertDiv.style.opacity = "0";
    alertDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: #f9edbe;
            color: #856404;
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-size: 14px;
            transition: opacity 0.5s ease-in-out; 
        ">
            <strong>Reply mode activated!</strong><br>
            Any message you send will be sent as a reply to this message. 
            <button id="cancelReply" style="background:none;border:none;color:#856404;text-decoration:underline;cursor:pointer;margin-left:5px;">Cancel</button>
        </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = "1";
    }, 10);

    document.getElementById("cancelReply").addEventListener("click", () => {
        alertDiv.style.opacity = "0";
        setTimeout(() => {
            alertDiv.remove();
            console.log("Reply mode canceled.");
        }, 500);
        // console.log(messagereplytoId);
        // defaultto-null--replytoid
        messagereplytoId = null;
    });
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.style.opacity = "0";
            setTimeout(() => {
                if (alertDiv.parentNode) alertDiv.remove();
            }, 500);
        }
    }, 10000);
}

// classroom-redirection-for-admin-and-teachers
const pushback = document.getElementById("class_back");
const pushforward = document.getElementById("class_push");

const baseUrl =
    window.location.origin + window.location.pathname.split("/lesson/")[0];

pushback?.addEventListener("click", () => {
    let thid = pushback?.dataset?.id;
    if (thid) {
        window.location.href = `${baseUrl}/lesson/${Number(thid)}`;
    }
});

pushforward?.addEventListener("click", () => {
    let thid = pushforward?.dataset?.id;
    if (thid) {
        window.location.href = `${baseUrl}/lesson/${Number(thid)}`;
    }
});

const lockPad = document.querySelector(".classroom-lock");
const lockedicon = document.querySelector(".locked-icon");
const unlockedicon = document.querySelector(".unlocked-icon");

// Set initial state
if (lockedicon && unlockedicon) {
    lockedicon.style.display = "none";
    unlockedicon.style.display = "block";
}

lockPad?.addEventListener("click", () => {
    const chatarea = document.querySelector(".chat_section");

    const lessonlayout = document.querySelector(".video_area");
    islocked = !islocked;

    if (islocked) {
        // lock-function
        lockedicon.style.display = "block";
        unlockedicon.style.display = "none";
        chatarea.classList.add("chatislocked");
        lessonlayout.classList.add("adjustlayout");
    } else {
        // unlock-function
        lockedicon.style.display = "none";
        unlockedicon.style.display = "block";
        chatarea.classList.remove("chatislocked");
        lessonlayout.classList.remove("adjustlayout");
    }
});
