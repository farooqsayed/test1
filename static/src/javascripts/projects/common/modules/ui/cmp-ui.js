// @flow
import { isInVariantSynchronous } from 'common/modules/experiments/ab';
import { commercialIabCompliant } from 'common/modules/experiments/tests/commercial-iab-compliant';
import { cmpConfig, cmpUi } from '@guardian/consent-management-platform';

const CMP_READY_CLASS = 'cmp-iframe-ready';
const OVERLAY_CLASS = 'cmp-overlay';
const IFRAME_CLASS = 'cmp-iframe';
let container: ?HTMLElement;
let uiPrepared: boolean = false;

const onReadyCmp = (): void => {
    if (container && container.parentNode) {
        container.classList.add(CMP_READY_CLASS);
    }
};

const onCloseCmp = (): void => {
    if (container && container.parentNode) {
        container.classList.remove(CMP_READY_CLASS);
        container.remove();
    }
};

const prepareUi = (): void => {
    if (uiPrepared) {
        return;
    }

    container = document.createElement('div');
    container.className = OVERLAY_CLASS;

    const iframe = document.createElement('iframe');
    iframe.src = cmpConfig.CMP_URL;
    iframe.className = IFRAME_CLASS;

    container.appendChild(iframe);

    cmpUi.setupMessageHandlers(onReadyCmp, onCloseCmp);

    uiPrepared = true;
};

const show = (): Promise<boolean> => {
    prepareUi();

    if (document.body && container && !container.parentElement) {
        document.body.appendChild(container);
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
export const _ = {
    reset: (): void => {
        if (container) {
            if (container.parentNode) {
                container.remove();
            }
            container = undefined;
        }
        uiPrepared = false;
    },
    CMP_READY_CLASS,
    OVERLAY_CLASS,
    IFRAME_CLASS,
    onReadyCmp,
    onCloseCmp,
};