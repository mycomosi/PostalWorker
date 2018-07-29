/**
 * PostalWorker Main Source
 * (Legacy Version - Adds global PostalWorker method to window global scope)
 * @Author: Russ Stratfull - 2018
 */


import {PostalWorker} from './PostalWorker';
import safeJsonStringify from "safe-json-stringify";

let _PostalWorker;
window.PostalWorker = () => {
    if (!_PostalWorker) {
        _PostalWorker = new PostalWorker({}, safeJsonStringify);
        return _PostalWorker;
    }
    else {
        return _PostalWorker;
    }
};
