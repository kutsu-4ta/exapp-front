import {todayString} from '../types/workspace'

export function formatTime(time: number): { main: string; sub: string } {
  const hours = Math.floor(time / 3600000)
  const mins = Math.floor((time % 3600000) / 60000)
  const secs = Math.floor((time % 60000) / 1000)
  const ms = Math.floor((time % 1000) / 10)
  const h = hours > 0 ? `${hours}:` : ''
  const m = mins < 10 && hours > 0 ? `0${mins}` : mins
  const s = secs < 10 ? `0${secs}` : secs
  const msStr = ms < 10 ? `0${ms}` : ms
  return { main: `${h}${m}:${s}`, sub: `.${msStr}` }
}

export function calcMinutes(time: number): number {
  return Math.ceil(time / 60000)
}

export function calcLogUrl(time: number): string {
  return `/workspace/${todayString()}?minutes=${calcMinutes(time)}`
}
