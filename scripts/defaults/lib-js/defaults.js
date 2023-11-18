"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementModifiers = exports.elements = exports.functions = void 0;
const regex_js_1 = require("oberknecht-utils/lib-js/variables/regex.js");
const utils_1 = require("oberknecht-utils/lib-js/utils");
const types_1 = require("./types");
class functions {
    static url = new URL(document.baseURI);
    static version;
    static options;
    static appendElementOptions = (element, options) => {
        if (!element || !options)
            return;
        Object.keys(options).forEach((optionName) => {
            switch (optionName) {
                case "classes": {
                    (0, utils_1.convertToArray)(options[optionName]).forEach((a) => element.classList.add(a));
                    break;
                }
                case "childNodes": {
                    (0, utils_1.convertToArray)(options[optionName]).forEach((a) => {
                        element.appendChild(a);
                    });
                    break;
                }
                case "style": {
                    Object.keys(options[optionName]).forEach((a) => {
                        // @ts-ignore
                        element.style[a] = options[optionName][a];
                    });
                    break;
                }
                case "parentElem":
                case "pe": {
                    functions.getElement(options[optionName]).appendChild(element);
                    break;
                }
                default: {
                    // @ts-ignore
                    if (options[optionName])
                        element[optionName] = options[optionName];
                }
            }
        });
    };
    static appendChildren = (elem, ...children) => {
        [...(0, utils_1.dissolveArray)(...children)].forEach((a) => elem.appendChild(a));
    };
    static checkBrowser = () => {
        return typeof window !== "undefined";
    };
    static getParent = (elem, number) => {
        if ((0, utils_1.isNullUndefined)(number) || number <= 1)
            return elem;
        return this.getParent(elem.parentElement, (number ?? 1) - 1);
    };
    static getElement = (elemOrQuery) => {
        if (!this.checkBrowser())
            throw Error("Not in browser");
        if (typeof elemOrQuery !== "string")
            return elemOrQuery;
        return document.querySelector(elemOrQuery);
    };
    static parseIconURL = (u, size) => {
        let u_ = new URL(u.startsWith("/") ? this.url.origin + u : u);
        if (this.version)
            u_.searchParams.set("version", this.version.npm);
        if (!u_.searchParams.get("size") && size !== null)
            u_.searchParams.set("size", size ?? "48");
        return u_.toString();
    };
    static copy = async (elemOrData, copyOptions_) => {
        let copyOptions = (0, utils_1.concatJSON)([
            functions.options?.copyOptions ?? {},
            copyOptions_ ?? {},
        ]);
        let withoutAnimation = copyOptions.withoutAnimation;
        let copyData;
        if (elemOrData instanceof HTMLElement) {
            copyData = copyOptions.customDataAttributeKey
                ? elemOrData.getAttribute(copyOptions.customDataAttributeKey)
                : // @ts-ignore
                    elemOrData.value ?? elemOrData.innerText ?? "";
        }
        else {
            switch ((0, utils_1.extendedTypeof)(elemOrData)) {
                case "json":
                case "object": {
                    copyData = JSON.stringify(elemOrData);
                    break;
                }
                default: {
                    copyData = elemOrData?.toString();
                    break;
                }
            }
        }
        navigator.clipboard.writeText(copyData);
        if (!withoutAnimation && elemOrData instanceof HTMLElement) {
            let animationParent = functions.getParent(elemOrData, copyOptions.animationParentsNum ?? 0) ??
                elemOrData;
            let animationDuration = copyOptions.animationDuration ?? types_1.defaultCopyAnimationDuration;
            await elementModifiers.tempClass(animationParent, ["jcopied-enable"], 300);
            await elementModifiers.tempClass(animationParent, ["jcopied"], animationDuration);
            await elementModifiers.tempClass(animationParent, ["jcopied-disable"], 500);
        }
    };
}
exports.functions = functions;
class elements {
    static createElement = (tagName, options) => {
        let r = document.createElement(tagName);
        functions.appendElementOptions(r, options);
        // @ts-ignore
        return r;
    };
    static parseLinks = (elemOrQuery, target, useMarkdownLinks) => {
        let elem = functions.getElement(elemOrQuery);
        let text = elem.innerText;
        const markdownReg = /\[[^\]]+\]\([^\)]+\)/g;
        const markdownMatchText = /(?<=\[)[^\]]+(?=\])/;
        const markdownMatchLink = /(?<=\()[^\)]+(?=\))/;
        let markdownMatches = text.match(markdownReg) ?? [];
        let markdownSplits = text.split(markdownReg);
        if (useMarkdownLinks)
            markdownSplits.forEach((markdownSplit, i) => {
                let markdownMatch = markdownMatches[i];
                if (!markdownMatch)
                    return;
                let markdownText = markdownMatch.match(markdownMatchText)?.[0];
                let markdownLink = markdownMatch.match(markdownMatchLink)?.[0];
                text = text.replace(markdownMatch, markdownText);
                let linkElem = elements.createElement("a", {
                    innerText: markdownText,
                    href: markdownLink,
                    target: target ?? "_blank",
                });
                elem.innerHTML = elem.innerHTML.replace(markdownMatch, linkElem.outerHTML);
            });
        text = text.replace(regex_js_1.regex.extraSpaceRegex(), "");
        let links = text.match(regex_js_1.regex.urlreg_()) ?? [];
        links.forEach((link) => {
            let linkElem = elements.createElement("a", {
                href: link,
                innerText: link,
                target: target ?? "_blank",
            });
            elem.innerHTML = elem.innerHTML.replace(link, linkElem.outerHTML);
        });
    };
    static parseADHD = (elemOrQuery, boldLength, noIgnoreLinks, ignoreCheck) => {
        let elem = functions.getElement(elemOrQuery);
        let text = elem.innerText;
        let textSplits = text.split(" ");
        elem.innerHTML = "";
        textSplits.forEach((textSplit) => {
            let boldLength_ = typeof boldLength === "number"
                ? boldLength
                : (0, utils_1.getFullNumber)(textSplit.length / 2);
            if (!noIgnoreLinks && regex_js_1.regex.urlreg().test(textSplit))
                boldLength_ = 0;
            let boldElem = elements.createElement("h", {
                classes: ["jADHD_bold"],
                innerText: textSplit.slice(0, boldLength_),
                style: {
                    fontWeight: "bold",
                },
            });
            let normalElem = elements.createElement("h", {
                innerText: textSplit.slice(boldLength_) + " ",
            });
            [boldElem, normalElem]
                .filter((a) => a.innerText.length > 0)
                .forEach((a) => elem.appendChild(a));
        });
    };
    static parseJSONText = (s) => {
        if (!["string", "object"].includes(typeof s))
            throw Error("s is not typeof string/object");
        let o = s;
        if (typeof s === "string")
            o = JSON.parse(s);
        return JSON.stringify(o, null, 2);
    };
    static convertToArray = (a) => {
        if (Array.isArray(a))
            return a;
        return [a];
    };
    static #popoutCount = 0;
    static get getPopoutCount() {
        return this.#popoutCount;
    }
    static popout = (popoutOptions_) => {
        this.#popoutCount++;
        let popoutOptions = (0, utils_1.concatJSON)([
            functions.options?.popoutOptions ?? {},
            popoutOptions_ ?? {},
        ]);
        let popoutWindow;
        let popoutWindowBackground;
        let parentElem_ = popoutOptions.parentElem ?? document.querySelector("body");
        if (!parentElem_.querySelector("jpopout") ||
            !popoutOptions.reuseOpenedPopout) {
            popoutWindow = elements.createElement("jpopout", {
                classes: ["dp-none"],
            });
            parentElem_.appendChild(popoutWindow);
        }
        if (!parentElem_.querySelector("jpopoutbg") ||
            !popoutOptions.reuseOpenedPopout) {
            popoutWindowBackground = elements.createElement("jpopoutbg", {
                classes: ["dp-none"],
            });
            parentElem_.appendChild(popoutWindowBackground);
        }
        if (popoutOptions.parentOptions)
            functions.appendElementOptions(parentElem_, popoutOptions.parentOptions);
        parentElem_.classList.add("jpopout-parent");
        popoutWindow = popoutWindow ?? parentElem_.querySelector("jpopout");
        popoutWindowBackground =
            popoutWindowBackground ?? parentElem_.querySelector("jpopoutbg");
        if (popoutOptions.zIndex) {
            popoutWindow.style.zIndex = popoutOptions.zIndex.toString();
            popoutWindowBackground.style.zIndex = (popoutOptions.zIndex - 1).toString();
        }
        popoutWindow.classList.remove("dp-none");
        popoutWindowBackground.classList.remove("dp-none");
        (async () => {
            await elementModifiers.tempClass(popoutWindow, "jpopout-enable", 250);
            await elementModifiers.tempClass(popoutWindowBackground, "jpopoutbg-enable", 250);
            popoutWindow.classList.remove("jpopout-enable");
            popoutWindowBackground.classList.remove("jpopoutbg-enable");
        })();
        popoutWindow.innerHTML = "";
        let this_ = this;
        function closePopout() {
            popoutOptions.onClose?.();
            (async () => {
                elementModifiers.tempClass(popoutWindow, "jpopout-disable", 250);
                await elementModifiers.tempClass(popoutWindowBackground, "jpopoutbg-disable", 250);
                popoutWindow.classList.remove("jpopout-disable");
                popoutWindow.classList.add("dp-none");
                popoutWindowBackground.classList.remove("jpopoutbg-disable");
                popoutWindowBackground.classList.add("dp-none");
                if (this_.getPopoutCount === 1)
                    parentElem_.classList.remove("jpopout-parent");
                this_.#popoutCount--;
                popoutOptions.onClosed?.();
                if (!popoutOptions.noRemoveAfterClose) {
                    popoutWindow.remove();
                    popoutWindowBackground.remove();
                }
            })();
        }
        let innerElems_ = (0, utils_1.convertToArray)(popoutOptions.innerElems, false, true);
        let popoutTop = elements.createElement("jpopout-top");
        (() => {
            let popoutTitle = elements.createElement("jtitle", {
                innerText: popoutOptions.title ?? "",
            });
            let popoutClose = elements.createElement("img", {
                classes: ["jpopout-close", "cursor-pointer"],
                src: popoutOptions.exitIconURL ?? types_1.defaultExitIconURL,
                width: functions?.options?.iconSize ?? 48,
                height: functions?.options?.iconSize ?? 48,
            });
            [
                ...innerElems_,
                ...(!popoutWindow.closePopout ? [popoutWindow] : []),
            ].forEach((a) => {
                if (!a.closePopout)
                    Object.defineProperty(a, "closePopout", {
                        get() {
                            return closePopout;
                        },
                    });
            });
            popoutClose.onclick = () => {
                closePopout();
            };
            [popoutTitle, popoutClose].forEach((a) => popoutTop.appendChild(a));
        })();
        let popoutBottom = elements.createElement("jpopout-bottom");
        (() => {
            innerElems_.forEach((a) => popoutBottom.appendChild(a));
        })();
        [popoutTop, popoutBottom].forEach((a) => popoutWindow.appendChild(a));
        return popoutWindow;
    };
    static notification = (dat, notificationOptions_) => {
        let notificationOptions = (0, utils_1.concatJSON)([
            functions.options?.notificationOptions ?? {},
            notificationOptions_ ?? {},
        ]);
        let isErr = notificationOptions.isError ||
            (dat?.data?.error ?? dat?.error ?? dat) instanceof Error;
        let animationDuration = isErr
            ? notificationOptions.animationDurationError ??
                types_1.defaultNotificationErrorAnimationDuration
            : notificationOptions.animationDuration ??
                types_1.defaultNotificationAnimationDuration;
        let notificationsParentElem = functions.getElement(notificationOptions.parentElem ?? "body");
        let notificationsContainerElem = notificationsParentElem.querySelector("jnotifications");
        if (!notificationsContainerElem) {
            notificationsContainerElem = elements.createElement("jnotifications");
            notificationsParentElem.appendChild(notificationsContainerElem);
        }
        let notificationElem = notificationsContainerElem.querySelector("jnotification");
        if (!notificationElem || !notificationOptions.reuseOpenedNotification) {
            notificationElem = elements.createElement("jnotification");
            notificationsContainerElem.appendChild(notificationElem);
        }
        function getNotificationsCount() {
            return [...notificationsContainerElem.querySelectorAll("jnotification")]
                .length;
        }
        notificationsParentElem.classList.add("jnotification-parent");
        notificationElem.innerHTML = "";
        (() => {
            let notificationTextElem = elements.createElement("jh", {
                classes: ["jnotification-text"],
                innerText: isErr ? "Error: " + (0, utils_1.returnErr)(dat) : dat,
            });
            let notificationButtonContainer = elements.createElement("div", {
                classes: ["jnotification-buttoncontainer"],
            });
            let notificationCloseButton = elements.createElement("button", {
                classes: ["jnotification-button-close"],
            });
            [
                notificationCloseButton,
                ...(0, utils_1.convertToArray)(notificationOptions.notificationButtons, false),
            ].forEach((a) => {
                a.classList.add("jnotification-button");
                notificationButtonContainer.appendChild(a);
            });
            (() => {
                let notificationCloseButtonImg = elements.createElement("img", {
                    src: notificationOptions.exitIconURL ?? types_1.defaultExitIconURL,
                    style: {
                        userSelect: "none",
                    },
                });
                notificationCloseButton.appendChild(notificationCloseButtonImg);
                notificationCloseButton.onclick = () => {
                    closeNotification();
                };
            })();
            [notificationTextElem, notificationButtonContainer].forEach((a) => notificationElem.appendChild(a));
        })();
        if (notificationOptions.zIndex)
            notificationElem.style.zIndex = notificationOptions.zIndex.toString();
        notificationElem.classList.remove("dp-none");
        (async () => {
            notificationElem.classList.add(isErr ? "jnotification-red" : "jnotification-green");
            if (notificationOptions.elementOptions)
                functions.appendElementOptions(notificationElem, notificationOptions.elementOptions);
            await elementModifiers.tempClass(notificationElem, ["jnotification-enable"], 
            // 1500
            500);
            await elementModifiers.tempClass(notificationElem, ["jnotification"], animationDuration, true);
            await closeNotification();
        })();
        async function closeNotification() {
            notificationElem.classList.remove("jnotification");
            await elementModifiers.tempClass(notificationElem, ["jnotification-disable"], 250);
            notificationElem.classList.add("dp-none");
            let notificationCount = getNotificationsCount() - 1;
            if (!notificationOptions.noRemoveAfterClose)
                notificationElem.remove();
            if (notificationCount === 0 &&
                !notificationOptions.noRemoveContainerAfterClose) {
                notificationsContainerElem.remove();
                notificationsParentElem.classList.remove("jnotification-parent");
            }
        }
        [
            notificationElem,
            notificationsContainerElem,
            notificationsParentElem,
            ...[...notificationElem.childNodes],
        ].forEach((a) => {
            // @ts-ignore
            if (a.closeNotification)
                return;
            Object.defineProperty(a, "closeNotification", {
                get() {
                    return closeNotification;
                },
            });
        });
    };
}
exports.elements = elements;
class elementModifiers {
    static tempClass = (elem, classNames, duration, neverResolveOnForever) => {
        return new Promise((resolve) => {
            let elem_ = functions.getElement(elem);
            let classNames_ = (0, utils_1.convertToArray)(classNames, false);
            classNames_ = classNames_.filter((a) => !elem_.classList.contains(a));
            if (classNames_.length === 0)
                return;
            elem_.classList.add(...classNames_);
            if (duration <= 0 || duration >= 2147483647) {
                if (!neverResolveOnForever)
                    return resolve();
                return;
            }
            setTimeout(() => {
                elem_.classList.remove(...classNames_);
                resolve();
            }, duration ?? 5000);
        });
    };
    static tempErrorHighlight = (elem, duration) => {
        this.tempClass(elem, ["error-highlight"], duration);
    };
    static disable = (elem) => {
        elem.setAttribute("disabled", "");
    };
    static enable = (elem) => {
        elem.removeAttribute("disabled");
    };
}
exports.elementModifiers = elementModifiers;
