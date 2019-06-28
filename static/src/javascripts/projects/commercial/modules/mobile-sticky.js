// @flow strict
import config from 'lib/config';
import fastdom from 'lib/fastdom-promise';
import { getCookie } from 'lib/cookies';
import { isBreakpoint } from 'lib/detect';
import { addSlot } from 'commercial/modules/dfp/add-slot';
import { createSlots } from 'commercial/modules/dfp/create-slots';
import { commercialUsMobileSticky } from 'common/modules/experiments/tests/commercial-us-mobile-sticky';
import { isInVariantSynchronous } from 'common/modules/experiments/ab';

const createAdWrapper = (): HTMLDivElement => {
    const wrapper: HTMLDivElement = document.createElement('div');
    wrapper.className = 'mobilesticky-container';
    const adSlot = createSlots('mobile-sticky', {})[0];
    wrapper.appendChild(adSlot);
    return wrapper;
};

const isInNA = (): boolean =>
    (getCookie('GU_geo_continent') || 'OTHER').toUpperCase() === 'NA';

export const init = (): Promise<void> => {
    if (
        isInNA() && // User is in North America
        isBreakpoint({ min: 'mobile', max: 'mobileLandscape' }) && // User is using a mobile device
        config.get('page.contentType') === 'Article' && // User is accessing an article
        isInVariantSynchronous(commercialUsMobileSticky, 'variant')
    ) {
        const mobileStickyWrapper = createAdWrapper();

        return fastdom
            .write(() => {
                if (document.body)
                    document.body.appendChild(mobileStickyWrapper);
            })
            .then(() => {
                const mobileStickyAdSlot = mobileStickyWrapper.querySelector(
                    '#dfp-ad--mobile-sticky'
                );
                if (mobileStickyAdSlot) addSlot(mobileStickyAdSlot, false);
            });
    }

    return Promise.resolve();
};
