/**
 * PostalWorker Main Source (ES6 Version - Exports )
 * Build ES6 module version
 * @Author: Russ Stratfull - 2018
 */


import {PostalWorker} from './PostalWorker';

let _PostalWorker;
export default function (configuration) {
    if (!_PostalWorker) {
        _PostalWorker = new PostalWorker(configuration);
        return _PostalWorker;
    }
    else return _PostalWorker;
}