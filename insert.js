var emojiDefaultSize = 100;
var recentEmojiDefaultNumber = 27;
const emo_url = chrome.runtime.getURL('data/emo_url.json');
var urlArr = [];

async function importEmoUrl() {
    let response = await fetch(emo_url);
    let json = await response.json();

    return json;
}

$(document).ready(function () {
    // Only run if this is a Mattermost page (by checking for a unique Mattermost element)
    if (!$('#post-create').length && !$('noscript').text().includes('Mattermost')) {
        // Remove any previously injected UI if present
        $('#newEmojiBtn').remove();
        $('#newEmojiPanel').remove();
        $('#newEmojiPanel-preview').remove();
        return;
    }
    if ($('noscript').text().search('Mattermost')) {
        waitForEl("#post-create", function () {
            mainApp();
        });
    };
});

function ensureEmojiButtonExists() {
    if (!$('#newEmojiBtn').length) {
        $(`<button id="newEmojiBtn" type="button" aria-label="select an emoji" class="IconContainer-hWSzHh bhaYqE"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-plus"><path d="M22 11v1a10 10 0 1 1-9-10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/><path d="M16 5h6"/><path d="M19 2v6"/></svg></button>`).insertAfter($('.FormattingBarContainer-fgcgon > div').last());
        
        attachEmojiButtonClickHandler();
    }
}

function ensureEmojiPanelExists() {
    if (!$('#newEmojiPanel').length) {
        var panel = createStaticEmojiPanel();
        $(panel).insertAfter($('.FormattingBarContainer-fgcgon').parent());
        
        // Re-create the emoji content if it doesn't exist
        if (!$('#emojipickeritems-new .icon-sticker').length) {
            createNewEmojiPanel().then(() => {
                $('#loading').remove();
                attachEmojiItemClickHandlers();
            });
        }
    }
}

function attachEmojiButtonClickHandler() {
    $("#newEmojiBtn").off('click').on('click', function(event) {
        var active = $(this).data('active');
        if (active) {
            $(this).data('active', false);
            $('#newEmojiPanel').hide();
        } else {
            $(this).data('active', true);
            if ($('.sidebar--right.move--left').length) {
                $('#newEmojiPanel').css('right', '417px');
                $('#newEmojiPanel-preview').css('right', '743px');
            } else {
                $('#newEmojiPanel').css('right', '12px');
                $('#newEmojiPanel-preview').css('right', '380px');
            }
            $('.emoji-picker').hide();
            $('#newEmojiPanel').css('bottom', '82px');
            $('#newEmojiPanel-preview').css('bottom', '389px');
            $('#newEmojiPanel-preview').css('background-size', '103px');
            $('#newEmojiPanel-preview').css('max-width', 'unset');
            $('#newEmojiPanel-preview').css('max-height', 'unset');
            $('#newEmojiPanel').show();
            event.stopPropagation();
        }
    });
}

async function mainApp() {
    ensureEmojiButtonExists();
    var panel = createStaticEmojiPanel();
    // Place the panel after the formatting bar's parent for better positioning
    $(panel).insertAfter($('.FormattingBarContainer-fgcgon').parent());


    var emojiPanel = await createNewEmojiPanel();

    $('#loading').remove();
    
    // Attach emoji item click handlers immediately
    attachEmojiItemClickHandlers();
    
    // Initialize all handlers and monitoring
    initializeEmojiSystem();
}

function attachEmojiItemClickHandlers() {
    $(".icon-sticker").off('click').on('click', async function () {
        let emojiSrc = $(this).find("img").attr("src");
        await pasteImageToTextBox(emojiSrc);
        let recentEmoji = localStorage.getItem("recentEmojis_extend");
        if (localStorage.getItem("recentEmojis_extend") !== null) {
            let recentEmoji = JSON.parse(localStorage.getItem("recentEmojis_extend"));
            if (recentEmoji.indexOf(emojiSrc) < 0) {
                recentEmoji.push(emojiSrc);
                if (recentEmoji.length > recentEmojiDefaultNumber) {
                    recentEmoji.shift();
                }

                loadRecentEmoji(recentEmoji);
                localStorage.setItem("recentEmojis_extend", JSON.stringify(recentEmoji));
            }
        } else {
            localStorage.setItem("recentEmojis_extend", JSON.stringify([emojiSrc]));
        }

        $('#newEmojiBtn').data('active', false);
        $('#newEmojiPanel-preview').hide();
        $('#newEmojiPanel').hide();
        
        // Ensure button is still present after meme selection
        setTimeout(function() {
            ensureEmojiButtonExists();
            ensureEmojiPanelExists();
            attachEmojiButtonClickHandler();
        }, 100);
    });
}

function attachOtherHandlers() {
    $("#close-btn").off('click').on('click', function () {
        $('#newEmojiBtn').data('active', false);
        $('#newEmojiPanel').hide();
    });

    $('.icon-sticker img').off('mouseenter mouseleave').hover(function () {
        $('#newEmojiPanel-preview').show();
        let url = $(this).attr('src');
        $('#newEmojiPanel-preview').css('background-image', 'url("' + url + '")');
    }, function () {
        $('#newEmojiPanel-preview').hide();
    });

    $("#newEmojiPanel").off('click').on('click', function (event) {
        event.stopPropagation();
    });
}

function attachDocumentHandlers() {
    $(document).off('click.emojiPanel').on('click.emojiPanel', function () {
        // $('#newEmojiBtn').data.active = false; // Remove this line so the button stays visible
        // $('#newEmojiPanel').hide();
    });
}

function initializeEmojiSystem() {
    attachOtherHandlers();
    attachDocumentHandlers();
    
    // Periodically check if the emoji system is still present and re-add if needed
    setInterval(function() {
        ensureEmojiButtonExists();
        ensureEmojiPanelExists();
        // Also ensure click handlers are attached if elements exist but handlers might be missing
        if ($('#newEmojiBtn').length) {
            attachEmojiButtonClickHandler();
        }
        if ($('#newEmojiPanel').length) {
            attachOtherHandlers();
            if ($('.icon-sticker').length) {
                attachEmojiItemClickHandlers();
            }
        }
    }, 1000);

    // rightbarObserveSetting();
}

// function rightbarObserveSetting() {
//     var targetNode = document.querySelector('#sidebar-right');
//     var config = {attributes: true};
//     var callback = function (mutationsList, observer) {
//         for (var mutation of mutationsList) {
//             if (mutation.type == 'attributes') {
//                 if (mutation.target.classList.length >= 2 && mutation.target.classList[1] === 'move--left') {
//                     $(`<span role="button" aria-label="Open new emoji picker" ><span id="newQuoteEmojiBtn" data-active-"false" class="fa fa-address-card-o icon--emoji-picker emoji-btn"></span></span>`).insertAfter($('.FormattingBarContainer-ffUiMo').last());
//                     function onSidebarEmojiBtnClick() {
//                         var active = $(this).data.active;
//                         if (active) {
//                             $(this).data.active = false;
//                             $('#newEmojiPanel').hide();
//                         } else {
//                             $(this).data.active = true;
//                             $('.emoji-picker').hide();
//                             $('#newEmojiPanel').css('top', '432px');
//                             $('#newEmojiPanel').css('right', '12px');

//                             $('#newEmojiPanel-preview').css('top', '849px');
//                             $('#newEmojiPanel-preview').css('right', '15px');
//                             $('#newEmojiPanel-preview').css('background-size', '80px');
//                             $('#newEmojiPanel-preview').css('max-width', '80px');
//                             $('#newEmojiPanel-preview').css('max-height', '80px');
//                             $('#newEmojiPanel').show();
//                             event.stopPropagation();
//                         }
//                     }
//                     $("#newQuoteEmojiBtn").click(onSidebarEmojiBtnClick);
//                 }
//             }
//         }
//     };

//     var observer = new MutationObserver(callback);
//     observer.observe(targetNode, config);
// }


function loadRecentEmoji(inputRecentEmoji = null) {
    var openDiv = `<div class="emoji-picker-items__container"><div class="emoji-picker__category-header"><span>Recently used</span></div></div><div class="emoji-picker-items__container">`;
    var contentDiv = "";
    if (inputRecentEmoji !== null) {
        var recentEmoji = inputRecentEmoji;
    } else if (localStorage.getItem("recentEmojis_extend") !== null) {
        var recentEmoji = JSON.parse(localStorage.getItem("recentEmojis_extend"));
    } else {
        var recentEmoji = null;
    }
    if (recentEmoji) {
        recentEmoji.reverse().forEach(function (url) {
            contentDiv += createHtmlFromUrlRecent(url);
        });

        var closeDiv = `</div>`;
        $('#recent_emoji').html(openDiv + contentDiv + closeDiv);
}
}

async function pasteImageToTextBox(imageUrl) {
    try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create a File object from the blob
        const fileName = imageUrl.split('/').pop() || 'emoji.png';
        const file = new File([blob], fileName, { type: blob.type });
        
        // Find the active textarea
        let target = null;
        if ($("#reply_textbox").length) {
            target = document.getElementById("reply_textbox");
        } else if ($("#post_textbox").length) {
            target = document.getElementById("post_textbox");
        }
        
        if (target) {
            target.focus();
            
            // Use only paste event - simplest and most reliable
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dataTransfer
            });
            
            target.dispatchEvent(pasteEvent);
            
        } else {
            throw new Error('No target element found');
        }
    } catch (error) {
        console.error('Failed to paste image:', error);
        // Fallback to the old method
        let content = generateEmoji(imageUrl);
        postTextBox(content);
    }
}

function postTextBox(content) {
    if ($("#reply_textbox").length) {
        document.getElementById("reply_textbox").value = content;
        var n = new Event('input', {
            bubbles: !0,
            cancelable: !0
        });

        document.getElementById('reply_textbox').dispatchEvent(n);
        var evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        });

        cb = document.querySelector('#thread--root ~ .post-create__container .comment-btn');
        cb.dispatchEvent(evt);

    } else if ($("#post_textbox").length) {
        document.getElementById("post_textbox").value = content;
        var n = new Event('input', {
            bubbles: !0,
            cancelable: !0
        });

        document.getElementById('post_textbox').dispatchEvent(n);

        var evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        });

        cb = document.querySelector('#create_post .post-body__actions a');
        cb.dispatchEvent(evt);
    }

}

function generateEmoji(url, size = "") {
    if (size == "") {
        size = emojiDefaultSize;
    }
    ;

    return '![Meme](' + url + ' =' + size + ' "Meme")';
}

async function createNewEmojiPanel() {
    var html = $('#emojipickeritems-new').html();
    var recentEmojiDiv = `<div id="recent_emoji"></div>`;
    $('#emojipickeritems-new').html(html + recentEmojiDiv);

    let data = JSON.parse(localStorage.getItem("newEmoji"));
    let rawData = await importEmoUrl();
    if (data === null) {
        data = rawData;
        localStorage.setItem("newEmoji", JSON.stringify(data));
    }

    urlArr = data;
    let contentDiv = "";
    Object.keys(urlArr).forEach(function (key) {
        contentDiv += createHtmlFromUrl(key, urlArr[key]);
    });

    var html = $('#emojipickeritems-new').html();
    $('#emojipickeritems-new').html(html + contentDiv);

    loadRecentEmoji();
}

function createHtmlFromUrl(name, urlArr) {
    var el = "";
    el += `<div>
            <div class="emoji-picker-items__container">
                <div class="emoji-picker__category-header"><span>` + name + `</span></div></div>
            <div class="emoji-picker-items__container">`;

    for (emoji of urlArr) {
        if (typeof emoji !== 'undefined') {
            el += `<div class="emoji-picker__item icon-sticker"><div><img src="` + emoji + `" class="emojisprite transition"></div></div>`;
        }
    }

    el += `</div></div></div>`;

    return el;
}

function createHtmlFromUrlRecent(url) {
    return `<div class="emoji-picker__item icon-sticker"><div><img src="` + url + `" class="emojisprite transition"></div></div>`;
}

function createStaticEmojiPanel() {
    var el = `<div>
            <div id="newEmojiPanel-preview">&nbsp;
            </div>
            <div id="newEmojiPanel" class="emoji-picker" style="display: none">
            <div class="emoji-picker__categories">
                <span>Meme+</span>
                <a style="float: right" id="close-btn" href="#"><i class="fa fa-close" title="Close"></i></a>
            </div>
            <div id="emojipickeritems-new" class="emoji-picker__items"><div id="loading"></div>`;
    el += `</div></div>`;

    el += `</div></div></div>`;

    return el;
}

var waitForEl = function (selector, callback) {
    if (jQuery(selector).length) {
        callback();
    } else {
        setTimeout(function () {
            waitForEl(selector, callback);
        }, 100);
    }
};