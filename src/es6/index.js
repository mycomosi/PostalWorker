/**
 * PostalWorker Main Source
 * (Legacy Version - Adds global PostalWorker method to window global scope)
 * @Author: Russ Stratfull - 2018
 */


import {PostalWorker} from './PostalWorker';
let _PostalWorker;
window.PostalWorker = () => {
    if (!_PostalWorker) {
        _PostalWorker = new PostalWorker();
        return _PostalWorker;
    }
    else {
        return _PostalWorker;
    }
};
