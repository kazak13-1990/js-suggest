import SearchAPI from "./api/SearchAPI";


const cache = {};

async function search(val, count = 10) {
    let searchResult;
    const cachedResult = cache[val];
    if (cachedResult && (cachedResult.count >= count)) {
        searchResult = cachedResult.data.slice().splice(0, count);
    } else {
        searchResult = await SearchAPI.search(val, count);
        cache[val] = {
            count: count,
            data: searchResult,
        };
    }

    return searchResult;
}

const SearchService = {
    search: search,
};

export default SearchService;