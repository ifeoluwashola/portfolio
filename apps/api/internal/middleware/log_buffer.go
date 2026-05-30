package middleware

import (
	"bytes"
	"sync"
)

// RingBuffer is a thread-safe ring buffer for storing recent log lines.
type RingBuffer struct {
	mu    sync.RWMutex
	lines []string
	max   int
	head  int
	count int
}

func NewRingBuffer(max int) *RingBuffer {
	return &RingBuffer{
		lines: make([]string, max),
		max:   max,
	}
}

// Write implements io.Writer. It splits the input by newlines and stores them.
func (r *RingBuffer) Write(p []byte) (n int, err error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Handle partial lines or multiple lines
	lines := bytes.Split(bytes.TrimSuffix(p, []byte("\n")), []byte("\n"))
	for _, line := range lines {
		r.lines[r.head] = string(line)
		r.head = (r.head + 1) % r.max
		if r.count < r.max {
			r.count++
		}
	}
	return len(p), nil
}

// GetLines returns all stored lines in chronological order.
func (r *RingBuffer) GetLines() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	res := make([]string, 0, r.count)
	if r.count == 0 {
		return res
	}

	if r.count < r.max {
		for i := 0; i < r.count; i++ {
			res = append(res, r.lines[i])
		}
	} else {
		for i := 0; i < r.max; i++ {
			idx := (r.head + i) % r.max
			res = append(res, r.lines[idx])
		}
	}
	return res
}
