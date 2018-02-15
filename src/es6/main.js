/**
 * PostalWorker Main Source (ES6 Version - Exports )
 * Build ES6 module version
 * @Author: Russ Stratfull - 2018
 */


import {PostalWorker} from './PostalWorker';

export default function (configuration) {

    return new PostalWorker(configuration);
    
}