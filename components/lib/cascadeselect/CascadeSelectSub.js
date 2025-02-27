import * as React from 'react';
import { PrimeReactContext } from '../api/Api';
import { useMountEffect, useUpdateEffect } from '../hooks/Hooks';
import { AngleRightIcon } from '../icons/angleright';
import { Ripple } from '../ripple/Ripple';
import { DomHandler, IconUtils, ObjectUtils, classNames, mergeProps } from '../utils/Utils';
export const CascadeSelectSub = React.memo((props) => {
    const [activeOptionState, setActiveOptionState] = React.useState(null);
    const elementRef = React.useRef(null);
    const context = React.useContext(PrimeReactContext);
    const { ptm, cx } = props;

    const getPTOptions = (key, options) => {
        return ptm(key, {
            hostName: props.hostName,
            state: { ...options }
        });
    };

    const position = () => {
        const parentItem = elementRef.current.parentElement;
        const containerOffset = DomHandler.getOffset(parentItem);
        const viewport = DomHandler.getViewport();
        const sublistWidth = elementRef.current.offsetParent ? elementRef.current.offsetWidth : DomHandler.getHiddenElementOuterWidth(element);
        const itemOuterWidth = DomHandler.getOuterWidth(parentItem.children[0]);

        if (parseInt(containerOffset.left, 10) + itemOuterWidth + sublistWidth > viewport.width - DomHandler.calculateScrollbarWidth()) {
            elementRef.current.style.left = '-100%';
        }
    };

    const onOptionSelect = (event) => {
        props.onOptionSelect && props.onOptionSelect(event);
    };

    const onKeyDown = (event, option) => {
        const listItem = event.currentTarget.parentElement;

        switch (event.key) {
            case 'Down':
            case 'ArrowDown':
                const nextItem = findNextItem(listItem);

                if (nextItem) {
                    nextItem.children[0].focus();
                }

                break;

            case 'Up':
            case 'ArrowUp':
                const prevItem = findPrevItem(listItem);

                if (prevItem) {
                    prevItem.children[0].focus();
                }

                break;

            case 'Right':
            case 'ArrowRight':
                if (option.disabled) return;

                if (isOptionGroup(option)) {
                    if (activeOptionState === option) {
                        listItem.children[1].children[0].children[0].focus();
                    } else {
                        setActiveOptionState(option);
                    }
                }

                break;

            case 'Left':
            case 'ArrowLeft':
                setActiveOptionState(null);

                const parentList = event.currentTarget.parentElement.parentElement.previousElementSibling;

                if (parentList) {
                    parentList.focus();
                }

                break;

            case 'Enter':
                onOptionClick(event, option);
                break;

            case 'Tab':
            case 'Escape':
                if (props.onPanelHide) {
                    props.onPanelHide();
                    event.preventDefault();
                }

                break;

            default:
                break;
        }

        event.preventDefault();
    };

    const findNextItem = (item) => {
        const nextItem = item.nextElementSibling;

        if (!nextItem) return null;

        const isDisabled = DomHandler.isAttributeEquals(nextItem, 'data-p-disabled', true);
        const isNotItem = DomHandler.isAttributeNotEquals(nextItem, 'data-pc-section', 'item');

        return isDisabled || isNotItem ? findNextItem(nextItem) : nextItem;
    };

    const findPrevItem = (item) => {
        const prevItem = item.previousElementSibling;

        if (!prevItem) return null;

        const isDisabled = DomHandler.isAttributeEquals(prevItem, 'data-p-disabled', true);
        const isNotItem = DomHandler.isAttributeNotEquals(prevItem, 'data-pc-section', 'item');

        return isDisabled || isNotItem ? findNextItem(prevItem) : prevItem;
    };

    const onOptionClick = (event, option) => {
        if (option.disabled) {
            props.onPanelHide();
            event.preventDefault();

            return;
        }

        if (isOptionGroup(option)) {
            setActiveOptionState((prevActiveOption) => (prevActiveOption === option ? null : option));

            if (props.onOptionGroupSelect) {
                props.onOptionGroupSelect({
                    originalEvent: event,
                    value: option
                });
            }
        } else {
            if (props.onOptionSelect) {
                props.onOptionSelect({
                    originalEvent: event,
                    value: getOptionValue(option)
                });
            }
        }
    };

    const onOptionGroupSelect = (event) => {
        props.onOptionGroupSelect && props.onOptionGroupSelect(event);
    };

    const getOptionLabel = (option) => {
        return props.optionLabel ? ObjectUtils.resolveFieldData(option, props.optionLabel) : option;
    };

    const getOptionValue = (option) => {
        return props.optionValue ? ObjectUtils.resolveFieldData(option, props.optionValue) : option;
    };

    const getOptionGroupLabel = (optionGroup) => {
        return props.optionGroupLabel ? ObjectUtils.resolveFieldData(optionGroup, props.optionGroupLabel) : null;
    };

    const getOptionGroupChildren = (optionGroup) => {
        return ObjectUtils.resolveFieldData(optionGroup, props.optionGroupChildren[props.level]);
    };

    const isOptionGroup = (option) => {
        return Object.prototype.hasOwnProperty.call(option, props.optionGroupChildren[props.level]);
    };

    const getOptionLabelToRender = (option) => {
        return isOptionGroup(option) ? getOptionGroupLabel(option) : getOptionLabel(option);
    };

    useMountEffect(() => {
        if (props.selectionPath && props.options && !props.dirty) {
            const activeOption = props.options.find((o) => props.selectionPath.includes(o));

            activeOption && setActiveOptionState(activeOption);
        }

        if (!props.root) {
            position();
        }
    });

    useUpdateEffect(() => {
        if (!props.parentActive) {
            setActiveOptionState(null);
        }
    }, [props.parentActive]);

    const createSubmenu = (option) => {
        if (isOptionGroup(option) && activeOptionState === option) {
            const options = getOptionGroupChildren(option);
            const parentActive = activeOptionState === option;
            const level = props.level + 1;

            return (
                <CascadeSelectSub
                    hostName={props.hostName}
                    options={options}
                    className={cx('sublist')}
                    selectionPath={props.selectionPath}
                    optionLabel={props.optionLabel}
                    optionValue={props.optionValue}
                    level={level}
                    onOptionSelect={onOptionSelect}
                    onOptionGroupSelect={onOptionGroupSelect}
                    parentActive={parentActive}
                    optionGroupLabel={props.optionGroupLabel}
                    notFoundContent={props.notFoundContent}
                    optionGroupChildren={props.optionGroupChildren}
                    dirty={props.dirty}
                    template={props.template}
                    onPanelHide={props.onPanelHide}
                    ptm={ptm}
                    cx={cx}
                />
            );
        }

        return null;
    };

    const createOption = (option, index) => {
        const submenu = createSubmenu(option);
        const textProps = mergeProps(
            {
                className: cx('text')
            },
            getPTOptions('text')
        );
        const content = props.template ? ObjectUtils.getJSXElement(props.template, getOptionValue(option)) : <span {...textProps}>{getOptionLabelToRender(option)}</span>;
        const optionGroupIconProps = mergeProps(
            {
                className: cx('optionGroupIcon')
            },
            getPTOptions('optionGroupIcon')
        );
        const icon = props.optionGroupIcon || <AngleRightIcon {...optionGroupIconProps} />;
        const optionGroup = isOptionGroup(option) && IconUtils.getJSXIcon(icon, { ...optionGroupIconProps }, { props });
        const key = getOptionLabelToRender(option) + '_' + index;
        const contentProps = mergeProps(
            {
                className: cx('content'),
                onClick: (event) => onOptionClick(event, option),
                tabIndex: 0,
                onKeyDown: (event) => onKeyDown(event, option)
            },
            getPTOptions('content')
        );

        const isSelected = activeOptionState === option;
        const isGroup = isOptionGroup(option);
        const itemProps = mergeProps(
            {
                className: classNames(option.className, cx('item', { option, isGroup, isSelected })),
                style: option.style,
                role: 'none',
                'data-p-item-group': isGroup,
                'data-p-highlight': isSelected,
                'data-p-disabled': option.disabled
            },
            getPTOptions('item', { option, selected: isSelected, group: isGroup })
        );

        return (
            <li key={key} {...itemProps}>
                <div {...contentProps}>
                    {content}
                    {optionGroup}
                    <Ripple />
                </div>
                {submenu}
            </li>
        );
    };

    const createMenu = () => {
        return props.options?.length ? props.options.map(createOption) : props.notFoundContent;
    };

    const submenu = createMenu();
    const listProps = mergeProps(
        {
            ref: elementRef,
            className: cx(props.level === 0 ? 'list' : 'sublist', { context }),
            role: 'listbox',
            'aria-orientation': 'horizontal'
        },
        props.level === 0 ? getPTOptions('list') : getPTOptions('sublist')
    );

    return <ul {...listProps}>{submenu}</ul>;
});
