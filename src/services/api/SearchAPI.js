import DATA from './DATA';
import FuzzySearch from "fuzzy-search";


const REQUEST_DELAY = 200;
const searcher = new FuzzySearch(DATA.data, ['title'], {sort: true});

const emulateRequest = (val, count) => {
    return new Promise(resolve => {
        setTimeout(() => {
            let searchResult = [];
            if (val) {
                searchResult = searcher.search(val);
            }
            resolve(searchResult.splice(0, count));
        }, REQUEST_DELAY);
    });
};

async function search(val, count) {
    return await emulateRequest(val, count);
}

const SearchAPI = {
    search: search,
};

export default SearchAPI;