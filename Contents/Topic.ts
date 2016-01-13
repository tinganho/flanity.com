
import { Model, HTTPOptions, relations, RelationType, noParentURL } from '../Library/Index';
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
}
