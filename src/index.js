import SuggestInput from "./components/SuggestInput/SuggestInput";
import './index.scss';


const onSearch = (searchValue) => {
    alert('Search: ' + searchValue);
};
const suggestInput = new SuggestInput(onSearch);

document.body.appendChild(suggestInput);