
import { Model, HTTPOptions, relations, RelationType, noParentURL, HTTP, HTTPResponse } from '../Library/Index';
import { Post } from './Post';

const enum DeleteEmailVerificationFeedback {
}

interface Props {
    id?: string;
    title?: string;
    description?: string;
    coverImage?: Blob;
    order?: number;
}

@noParentURL
export class Topic extends Model<Props> {
    public follow(): Promise<any> {
        this.increment('followers');
        return HTTP.post(this.getModelURL() + '/followers').catch((err)=> {
            this.decrement('followers');
        });
    }

    public unfollow(): Promise<any> {
        this.decrement('followers');
        return HTTP.del(this.getModelURL() + '/followers/me').catch((err)=> {
            this.increment('followers');
        });
    }
}
