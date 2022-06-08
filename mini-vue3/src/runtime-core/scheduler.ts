const queue: any[] = []

const p = Promise.resolve()

// 避免产生多余的 resolve 回调函数，push 进队列，只需要 then 一次。
let isFlushPending = false

// 开发时候用的 nextTick，可传入，可 await 等待。
export function nextTick(fn) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true

  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}
