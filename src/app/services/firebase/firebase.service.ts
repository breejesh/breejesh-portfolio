import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap, shareReplay } from 'rxjs/operators';

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
  private http = inject(HttpClient);
  
  // Realtime Database URL based on firebaserc project default.
  // Customizable by users if needed.
  private firebaseUrl = 'https://breejesh-rathod-default-rtdb.firebaseio.com';

  // Hashed User Identifier (IP-based or localStorage fallback)
  readonly userHash$: Observable<string> = this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
    map(res => this.hashString(res.ip)),
    catchError(() => {
      // Fallback to local storage UUID if IP API fails
      let localId = localStorage.getItem('blog_user_id');
      if (!localId) {
        localId = 'usr_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('blog_user_id', localId);
      }
      return of(this.hashString(localId));
    }),
    shareReplay(1)
  );

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  // ─── Views ───────────────────────────────────────────────────────────
  
  getViews(slug: string): Observable<number> {
    const cleanSlug = slug.replace(/\//g, '_');
    return this.http.get<number | null>(`${this.firebaseUrl}/views/${cleanSlug}.json`).pipe(
      map(views => views || 0),
      catchError(() => of(0))
    );
  }

  incrementViews(slug: string): Observable<number> {
    const cleanSlug = slug.replace(/\//g, '_');
    return this.getViews(cleanSlug).pipe(
      switchMap(currentViews => {
        const nextViews = currentViews + 1;
        return this.http.put<number>(`${this.firebaseUrl}/views/${cleanSlug}.json`, nextViews).pipe(
          map(() => nextViews),
          catchError(() => of(currentViews))
        );
      })
    );
  }

  // ─── Likes ───────────────────────────────────────────────────────────
  
  getLikesInfo(slug: string): Observable<{ count: number; hasLiked: boolean }> {
    const cleanSlug = slug.replace(/\//g, '_');
    return combineLatest([
      this.http.get<Record<string, boolean> | null>(`${this.firebaseUrl}/likes/${cleanSlug}.json`).pipe(
        map(likes => likes || {}),
        catchError(() => of({}))
      ),
      this.userHash$
    ]).pipe(
      map(([likes, userHash]) => {
        const keys = Object.keys(likes);
        return {
          count: keys.length,
          hasLiked: !!likes[userHash]
        };
      })
    );
  }

  toggleLike(slug: string): Observable<{ count: number; hasLiked: boolean }> {
    const cleanSlug = slug.replace(/\//g, '_');
    return combineLatest([
      this.getLikesInfo(cleanSlug),
      this.userHash$
    ]).pipe(
      switchMap(([info, userHash]) => {
        const url = `${this.firebaseUrl}/likes/${cleanSlug}/${userHash}.json`;
        if (info.hasLiked) {
          // Unlike: Remove the user node
          return this.http.delete(url).pipe(
            map(() => ({
              count: Math.max(0, info.count - 1),
              hasLiked: false
            }))
          );
        } else {
          // Like: Write true
          return this.http.put(url, true).pipe(
            map(() => ({
              count: info.count + 1,
              hasLiked: true
            }))
          );
        }
      }),
      catchError(() => of({ count: 0, hasLiked: false }))
    );
  }

  // ─── Comments ────────────────────────────────────────────────────────
  
  getComments(slug: string): Observable<Comment[]> {
    const cleanSlug = slug.replace(/\//g, '_');
    return this.http.get<Record<string, Comment> | null>(`${this.firebaseUrl}/comments/${cleanSlug}.json`).pipe(
      map(comments => {
        if (!comments) return [];
        return Object.entries(comments).map(([id, comment]) => ({
          id,
          ...comment
        })).sort((a, b) => b.timestamp - a.timestamp); // Newest first
      }),
      catchError(() => of([]))
    );
  }

  addComment(slug: string, name: string, text: string): Observable<Comment> {
    const cleanSlug = slug.replace(/\//g, '_');
    const newComment: Comment = {
      name,
      text,
      timestamp: Date.now()
    };
    return this.http.post<{ name: string }>(`${this.firebaseUrl}/comments/${cleanSlug}.json`, newComment).pipe(
      map(res => ({
        id: res.name,
        ...newComment
      }))
    );
  }
}
