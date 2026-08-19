import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Comment {
  id?: string;
  name: string;
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  readonly userHash$: Observable<string> = of('local_user');

  // ─── Views ───────────────────────────────────────────────────────────
  
  getViews(slug: string): Observable<number> {
    if (typeof localStorage === 'undefined') return of(0);
    const cleanSlug = slug.replace(/\//g, '_');
    const views = parseInt(localStorage.getItem(`blog_views_${cleanSlug}`) || '0', 10);
    return of(views);
  }

  incrementViews(slug: string): Observable<number> {
    if (typeof localStorage === 'undefined') return of(0);
    const cleanSlug = slug.replace(/\//g, '_');
    const key = `blog_views_${cleanSlug}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const next = current + 1;
    localStorage.setItem(key, next.toString());
    return of(next);
  }

  // ─── Likes ───────────────────────────────────────────────────────────
  
  getLikesInfo(slug: string): Observable<{ count: number; hasLiked: boolean }> {
    if (typeof localStorage === 'undefined') return of({ count: 0, hasLiked: false });
    const cleanSlug = slug.replace(/\//g, '_');
    const hasLiked = localStorage.getItem(`blog_liked_${cleanSlug}`) === 'true';
    const count = parseInt(localStorage.getItem(`blog_likes_count_${cleanSlug}`) || (hasLiked ? '1' : '0'), 10);
    return of({ count, hasLiked });
  }

  toggleLike(slug: string): Observable<{ count: number; hasLiked: boolean }> {
    if (typeof localStorage === 'undefined') return of({ count: 0, hasLiked: false });
    const cleanSlug = slug.replace(/\//g, '_');
    const likeKey = `blog_liked_${cleanSlug}`;
    const countKey = `blog_likes_count_${cleanSlug}`;
    
    const currentlyLiked = localStorage.getItem(likeKey) === 'true';
    const currentCount = parseInt(localStorage.getItem(countKey) || (currentlyLiked ? '1' : '0'), 10);
    
    const nextLiked = !currentlyLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    localStorage.setItem(likeKey, nextLiked ? 'true' : 'false');
    localStorage.setItem(countKey, nextCount.toString());
    
    return of({ count: nextCount, hasLiked: nextLiked });
  }

  // ─── Comments ────────────────────────────────────────────────────────
  
  getComments(slug: string): Observable<Comment[]> {
    if (typeof localStorage === 'undefined') return of([]);
    const cleanSlug = slug.replace(/\//g, '_');
    try {
      const raw = localStorage.getItem(`blog_comments_${cleanSlug}`);
      const comments: Comment[] = raw ? JSON.parse(raw) : [];
      return of(comments.sort((a, b) => b.timestamp - a.timestamp));
    } catch {
      return of([]);
    }
  }

  addComment(slug: string, name: string, text: string): Observable<Comment> {
    const cleanSlug = slug.replace(/\//g, '_');
    const newComment: Comment = {
      id: 'cmt_' + Math.random().toString(36).substring(2, 11),
      name,
      text,
      timestamp: Date.now()
    };
    
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`blog_comments_${cleanSlug}`);
        const comments: Comment[] = raw ? JSON.parse(raw) : [];
        comments.unshift(newComment);
        localStorage.setItem(`blog_comments_${cleanSlug}`, JSON.stringify(comments));
      } catch {
        // Fallback gracefully
      }
    }
    
    return of(newComment);
  }
}
