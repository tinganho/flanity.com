
import { Collection, RequestInfo } from '../Library/Index';
import { Post } from './Post';

@Collection.model(Post)
@Collection.noParentURL
export class Posts extends Collection<Post> {
}
