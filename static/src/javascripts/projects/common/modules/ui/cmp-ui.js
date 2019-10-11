// @flow
import { isInVariantSynchronous } from 'common/modules/experiments/ab';
import { commercialIabCompliant } from 'common/modules/experiments/tests/commercial-iab-compliant';
import { cmpConfig, cmpUi } from '@guardian/consent-management-platform';
import fastdom from 'lib/fastdom-promise';
import reportError from 'lib/report-error';

const CMP_READY_CLASS = 'cmp-iframe-ready';
const IFRAME_CLASS = 'cmp-iframe';
let iframe: ?HTMLIFrameElement;
let uiPrepared: boolean = false;

const onReadyCmp = (): Promise<void> =>
    fastdom.write(() => {
        if (iframe && iframe.parentNode) {
            iframe.classList.add(CMP_READY_CLASS);
        }
    });

const onCloseCmp = (): Promise<void> =>
    fastdom.write(() => {
        if (iframe && iframe.parentNode) {
            iframe.classList.remove(CMP_READY_CLASS);
        }
    });

const onErrorCmp = (error: Error): void => {
    reportError(
        error,
        {
            feature: 'cmp',
        },
        false
    );
};

const prepareUi = (): void => {
    if (uiPrepared) {
        return;
    }

    iframe = document.createElement('iframe');

    iframe.className = IFRAME_CLASS;
    iframe.src = cmpConfig.CMP_URL;
    iframe.tabIndex = 1;
    iframe.addEventListener(
        'touchmove',
        (evt: Event) => {
            evt.preventDefault();
        },
        false
    );

    cmpUi.setupMessageHandlers(onReadyCmp, onCloseCmp, onErrorCmp);

    uiPrepared = true;
};

const show = (): Promise<boolean> => {
    prepareUi();

    if (document.body && iframe && !iframe.parentElement) {
        document.body.appendChild(iframe);
    }

    return Promise.resolve(true);
};

const handlePrivacySettingsClick = (evt: Event): void => {
    evt.preventDefault();

    show();
};

export const addPrivacySettingsLink = (): void => {
    if (!isInVariantSynchronous(commercialIabCompliant, 'variant')) {
        return;
    }

    const privacyLink: ?HTMLElement = document.querySelector(
        'a[data-link-name=privacy]'
    );

    if (privacyLink) {
        const privacyLinkListItem: ?Element = privacyLink.parentElement;

        if (privacyLinkListItem) {
            const newPrivacyLink: HTMLElement = privacyLink.cloneNode(false);

            newPrivacyLink.dataset.linkName = 'privacy-settings';
            newPrivacyLink.removeAttribute('href');
            newPrivacyLink.innerText = 'Privacy settings';

            const newPrivacyLinkListItem: Element = privacyLinkListItem.cloneNode(
                false
            );

            newPrivacyLinkListItem.appendChild(newPrivacyLink);

            privacyLinkListItem.insertAdjacentElement(
                'afterend',
                newPrivacyLinkListItem
            );

            newPrivacyLink.addEventListener(
                'click',
                handlePrivacySettingsClick
            );
        }
    }
};

export const consentManagementPlatformUi = {
    id: 'cmpUi',
    canShow: (): Promise<boolean> => {
        if (isInVariantSynchronous(commercialIabCompliant, 'variant')) {
            return Promise.resolve(cmpUi.canShow());
        }

        return Promise.resolve(false);
    },
    show,
};

// Exposed for testing purposes only
// export const _ = {
//     reset: (): void => {
//         if (iframe) {
//             if (iframe.parentNode) {
//                 iframe.remove();
//             }
//             iframe = undefined;
//         }
//         uiPrepared = false;
//     },
//     CMP_READY_CLASS,
//     CMP_ANIMATE_CLASS,
//     OVERLAY_CLASS,
//     IFRAME_CLASS,
//     onReadyCmp,
//     onCloseCmp,
// };
