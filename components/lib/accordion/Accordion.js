import * as React from 'react';
import { ariaLabel, PrimeReactContext } from '../api/Api';
import { useHandleStyle } from '../componentbase/ComponentBase';
import { CSSTransition } from '../csstransition/CSSTransition';
import { useMountEffect } from '../hooks/Hooks';
import { ChevronDownIcon } from '../icons/chevrondown';
import { ChevronRightIcon } from '../icons/chevronright';
import { classNames, IconUtils, mergeProps, ObjectUtils, UniqueComponentId } from '../utils/Utils';
import { AccordionBase, AccordionTabBase } from './AccordionBase';

export const AccordionTab = () => {};

export const Accordion = React.forwardRef((inProps, ref) => {
    const context = React.useContext(PrimeReactContext);
    const props = AccordionBase.getProps(inProps, context);
    const [idState, setIdState] = React.useState(props.id);
    const [activeIndexState, setActiveIndexState] = React.useState(props.activeIndex);
    const elementRef = React.useRef(null);
    const activeIndex = props.onTabChange ? props.activeIndex : activeIndexState;
    const count = React.Children.count(props.children);
    const metaData = {
        props,
        state: {
            id: idState,
            activeIndex: activeIndexState
        }
    };

    const { ptm, ptmo, cx, sx, isUnstyled } = AccordionBase.setMetaData({
        ...metaData
    });

    useHandleStyle(AccordionBase.css.styles, isUnstyled, { name: 'accordion' });

    const getTabPT = (tab, key, index) => {
        const atProps = AccordionTabBase.getCProps(tab);
        const tabMetaData = {
            // props: atProps, /* @todo */
            parent: metaData,
            context: {
                index,
                count,
                first: index === 0,
                last: index === count - 1,
                selected: isSelected(index),
                disabled: getTabProp(tab, 'disabled')
            }
        };

        return mergeProps(ptm(`accordion.${key}`, { tab: tabMetaData }), ptm(`accordiontab.${key}`, { accordiontab: tabMetaData }), ptm(`accordiontab.${key}`, tabMetaData), ptmo(getTabProp(tab, 'pt'), key, tabMetaData));
    };

    const getTabProp = (tab, name) => AccordionTabBase.getCProp(tab, name);

    const onTabHeaderClick = (event, tab, index) => {
        if (!getTabProp(tab, 'disabled')) {
            const selected = isSelected(index);
            let newActiveIndex = null;

            if (props.multiple) {
                const indexes = activeIndex || [];

                newActiveIndex = selected ? indexes.filter((i) => i !== index) : [...indexes, index];
            } else {
                newActiveIndex = selected ? null : index;
            }

            const callback = selected ? props.onTabClose : props.onTabOpen;

            callback && callback({ originalEvent: event, index: index });

            if (props.onTabChange) {
                props.onTabChange({
                    originalEvent: event,
                    index: newActiveIndex
                });
            } else {
                setActiveIndexState(newActiveIndex);
            }
        }

        event.preventDefault();
    };

    const isSelected = (index) => {
        return props.multiple && Array.isArray(activeIndex) ? activeIndex && activeIndex.some((i) => i === index) : activeIndex === index;
    };

    React.useImperativeHandle(ref, () => ({
        props,
        getElement: () => elementRef.current
    }));

    useMountEffect(() => {
        if (!idState) {
            setIdState(UniqueComponentId());
        }
    });

    if (!idState) {
        return null;
    }

    const createTabHeader = (tab, selected, index) => {
        const style = { ...(getTabProp(tab, 'style') || {}), ...(getTabProp(tab, 'headerStyle') || {}) };
        const headerId = idState + '_header_' + index;
        const ariaControls = idState + '_content_' + index;
        const tabIndex = getTabProp(tab, 'disabled') ? -1 : getTabProp(tab, 'tabIndex');
        const headerTitleProps = mergeProps(
            {
                className: cx('accordiontab.headertitle')
            },
            getTabPT(tab, 'headertitle', index)
        );
        const tabCProps = AccordionTabBase.getCProps(tab);
        const header = getTabProp(tab, 'headerTemplate') ? ObjectUtils.getJSXElement(getTabProp(tab, 'headerTemplate'), tabCProps) : <span {...headerTitleProps}>{ObjectUtils.getJSXElement(getTabProp(tab, 'header'), tabCProps)}</span>;
        const headerIconProps = mergeProps(
            {
                className: cx('accordiontab.headericon')
            },
            getTabPT(tab, 'headericon', index)
        );
        const icon = selected ? props.collapseIcon || <ChevronDownIcon {...headerIconProps} /> : props.expandIcon || <ChevronRightIcon {...headerIconProps} />;
        const toggleIcon = IconUtils.getJSXIcon(icon, { ...headerIconProps }, { props, selected });
        const label = selected ? ariaLabel('collapseLabel') : ariaLabel('expandLabel');
        const headerProps = mergeProps(
            {
                className: classNames(getTabProp(tab, 'headerClassName'), getTabProp(tab, 'className'), cx('accordiontab.header', { selected, getTabProp, tab })),
                style,
                'data-p-highlight': selected,
                'data-p-disabled': getTabProp(tab, 'disabled')
            },
            getTabPT(tab, 'header', index)
        );

        const headerActionProps = mergeProps(
            {
                id: headerId,
                href: '#' + ariaControls,
                className: cx('accordiontab.headeraction'),
                role: 'tab',
                tabIndex,
                onClick: (e) => onTabHeaderClick(e, tab, index),
                'aria-label': label,
                'aria-controls': ariaControls,
                'aria-expanded': selected
            },
            getTabPT(tab, 'headeraction', index)
        );

        return (
            <div {...headerProps}>
                <a {...headerActionProps}>
                    {toggleIcon}
                    {header}
                </a>
            </div>
        );
    };

    const createTabContent = (tab, selected, index) => {
        const style = { ...(getTabProp(tab, 'style') || {}), ...(getTabProp(tab, 'contentStyle') || {}) };
        const contentId = idState + '_content_' + index;
        const ariaLabelledby = idState + '_header_' + index;
        const contentRef = React.createRef();
        const toggleableContentProps = mergeProps(
            {
                id: contentId,
                ref: contentRef,
                className: classNames(getTabProp(tab, 'contentClassName'), getTabProp(tab, 'className'), cx('accordiontab.toggleablecontent')),
                style,
                role: 'region',
                'aria-labelledby': ariaLabelledby
            },
            getTabPT(tab, 'toggleablecontent', index)
        );

        const contentProps = mergeProps(
            {
                className: cx('accordiontab.content')
            },
            getTabPT(tab, 'content', index)
        );

        const transitionProps = mergeProps(
            {
                classNames: cx('accordiontab.transition'),
                timeout: { enter: 1000, exit: 450 },
                in: selected,
                unmountOnExit: true,
                options: props.transitionOptions
            },
            getTabPT(tab, 'transition', index)
        );

        return (
            <CSSTransition nodeRef={contentRef} {...transitionProps}>
                <div {...toggleableContentProps}>
                    <div {...contentProps}>{getTabProp(tab, 'children')}</div>
                </div>
            </CSSTransition>
        );
    };

    const createTab = (tab, index) => {
        if (ObjectUtils.isValidChild(tab, 'AccordionTab')) {
            const key = idState + '_' + index;
            const selected = isSelected(index);
            const tabHeader = createTabHeader(tab, selected, index);
            const tabContent = createTabContent(tab, selected, index);

            const rootProps = mergeProps(
                {
                    key,
                    className: cx('accordiontab.root', { selected })
                },
                AccordionTabBase.getCOtherProps(tab),
                getTabPT(tab, 'root', index)
            );

            return (
                <div {...rootProps}>
                    {tabHeader}
                    {tabContent}
                </div>
            );
        }

        return null;
    };

    const createTabs = () => {
        return React.Children.map(props.children, createTab);
    };

    const tabs = createTabs();
    const rootProps = mergeProps(
        {
            className: classNames(props.className, cx('root')),
            style: props.style
        },
        AccordionBase.getOtherProps(props),
        ptm('root')
    );

    return (
        <div id={idState} ref={elementRef} {...rootProps}>
            {tabs}
        </div>
    );
});

AccordionTab.displayName = 'AccordionTab';

Accordion.displayName = 'Accordion';
