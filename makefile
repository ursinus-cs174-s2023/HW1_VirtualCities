CC=g++
CFLAGS=-std=c++11 -g -Wall 

all: simplescene

simplescene: Scene3D.h simplescene.cpp
	$(CC) $(CFLAGS) -o simplescene simplescene.cpp

clean:
	rm *.o *.exe *.stackdump simplescene