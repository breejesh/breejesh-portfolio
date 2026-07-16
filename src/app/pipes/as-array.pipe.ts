import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'asArray',
  standalone: true
})
export class AsArrayPipe implements PipeTransform {
  transform(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }
}
