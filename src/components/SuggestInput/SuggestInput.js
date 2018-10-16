import closestPolyfill from '../../utils/closest-polyfill';
import SearchService from '../../services/SearchService';
import './suggest-input.css';


const MAX_SUGGEST_COUNT = 10;
const DEFAULT_ITEM_INDEX = -1;
const handleKeys = {
    keyUp: 38,
    keyDown: 40,
    enter: 13,
    esc: 27,
};
const noop = () => {};

const handlerActions = {
    [handleKeys.keyUp]: function() {
        const {activeItemIndex} = this;
        this.selectSuggestItemWithCheck(activeItemIndex - 1);
    },
    [handleKeys.keyDown]: function() {
        const {activeItemIndex} = this;
        this.selectSuggestItemWithCheck(activeItemIndex + 1);
    },
    [handleKeys.enter]: function() {
        const {activeItemIndex} = this;
        this.onSelectSuggest(activeItemIndex);
    },
    [handleKeys.esc]: function() {
        this.onBlur();
    },
};

export default class SuggestInput{
    constructor(onAction = noop, maxSuggestCount = MAX_SUGGEST_COUNT) {
        this.maxSuggestCount = maxSuggestCount;
        this.activeItemIndex = DEFAULT_ITEM_INDEX;
        this.inputValue = '';
        this.suggestResults = [];
        this.searchCount = 0;

        window.addEventListener('click', this.onClick.bind(this));

        this.onAction = onAction;

        this.rootContainer = document.createElement('div');
        this.rootContainer.setAttribute('class', 'suggest-input');

        this.suggestInput = document.createElement('input');
        this.suggestInput.setAttribute('class', 'input');
        this.suggestInput.setAttribute('placeholder', 'Start typing...');
        this.suggestInput.oninput = this.onChange.bind(this);
        this.suggestInput.onkeydown = this.onKeyPress.bind(this);

        this.suggestContainer = document.createElement('ul');
        this.suggestContainer.setAttribute('class', 'suggest-block');

        this.rootContainer.appendChild(this.suggestInput);
        return this.rootContainer;
    }

    async search(value){
        const {maxSuggestCount} = this;
        let suggestResults;
        if (value !== '') {
            suggestResults = await SearchService.search(value, maxSuggestCount);
        } else {
            suggestResults = [];
        }
        return suggestResults;
    }

    createSuggestElement({isActive, suggestItem, onSelect}) {
        const suggestElement = document.createElement('li');
        const classes = isActive ? 'suggest-item isActive' : 'suggest-item';
        suggestElement.setAttribute('class', classes);
        suggestElement.onclick = (event) => {
            event.stopPropagation();
            onSelect();
        };
        suggestElement.innerHTML = `<div>${suggestItem.title}</div>`;
        return suggestElement;
    }

    getSuggestElements() {
        const {activeItemIndex} = this;

        const suggestElements = this.suggestResults.map((suggestItem, index) => {
            const isActive = (index === activeItemIndex);
            const suggestElement = this.createSuggestElement({
                isActive,
                suggestItem,
                onSelect: () => this.onSelectSuggest(index),
            });
            return suggestElement;
        });
        return suggestElements;
    }

    renderSuggests() {
        if (this.suggestResults.length === 0) {
            if (this.suggestContainer.parentNode) {
                this.suggestContainer.parentNode.removeChild(this.suggestContainer);
            }
        } else {
            this.suggestContainer.innerHTML = '';
            const suggestElements = this.getSuggestElements();
            suggestElements.forEach(suggestElement => this.suggestContainer.appendChild(suggestElement));
            this.rootContainer.appendChild(this.suggestContainer);
        }
    }

    async searchAndRenderSuggest(value){
        this.suggestResults = await this.search(value);
        this.renderSuggests();
    }

    selectSuggestItem(newActiveItem) {
        const {suggestResults} = this;
        if (suggestResults.length > 0) {
            const maxActiveItemIndex = suggestResults.length - 1;
            if (newActiveItem > maxActiveItemIndex) {
                newActiveItem = DEFAULT_ITEM_INDEX;
            }
            if (newActiveItem < -1) {
                newActiveItem = maxActiveItemIndex;
            }
            this.activeItemIndex = newActiveItem;

            const suggestValue = suggestResults[newActiveItem] && suggestResults[newActiveItem].title;
            this.suggestInput.value = suggestValue || this.inputValue;

            this.renderSuggests();
        }
    };

    selectSuggestItemWithCheck(newActiveItem) {
        const {suggestResults} = this;
        if (suggestResults.length === 0) {
            this.searchAndRenderSuggest(this.inputValue);
        } else {
            this.selectSuggestItem(newActiveItem);
        }
    }

    async onChange(event){
        const value = event.target.value;
        this.inputValue = value;
        this.activeItemIndex = DEFAULT_ITEM_INDEX;
        const currSearchCount = ++this.searchCount;

        this.suggestResults = await this.search(value);
        if (currSearchCount === this.searchCount) {
            this.renderSuggests();
        }
    }

    async onKeyPress(event) {
        const keyCode = event.keyCode || event.which;

        const action = handlerActions[keyCode];
        if (action) {
            event.preventDefault();
            action.call(this);
        }
    };

    onSelectSuggest(suggestIndex, finished = true) {
        const {onAction} = this;
        const {inputValue, suggestResults} = this;
        let newInputValue = inputValue;
        const suggestValue = suggestResults[suggestIndex] && suggestResults[suggestIndex].title;
        if (suggestValue) {
            newInputValue = suggestValue;
        }

        this.activeItemIndex = DEFAULT_ITEM_INDEX;
        this.suggestResults = [];
        this.suggestInput.value = newInputValue;
        this.inputValue = newInputValue;

        this.renderSuggests();

        if (finished) {
            onAction(newInputValue);
        }
    };

    onBlur() {
        const {activeItemIndex} = this;
        this.onSelectSuggest(activeItemIndex, false);
    };

    onClick(event) {
        if (!event.target.closest('.suggest-input, .suggest-item')){
            this.onBlur();
        }
    }
}
