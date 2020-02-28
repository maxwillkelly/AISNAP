#include "stdafx.h"
#include "data.hpp"
#include <iostream>
#include <list>
#include <string>
#include <functional>
#include <fstream>
#include <map>
#include <sstream>
#include <network.h>
#include <vector>

using namespace std;


typedef struct route
{
  string sourceAirport;
  string sourceCountry;
  string destinationAirport;
  string destinationCountry;
} Route;

PNGraph genRandomGraph(PNGraph G, int nodes, int edges);
int plotGraph(TNodeEDatNet<TNodeData, TEdgeData> &G);
int traverseNodes(PNGraph G);
int traverseEdges(PNGraph G);
int traverseGraph(TNodeEDatNet<TNodeData, TEdgeData> G);
PNGraph getNodes(PNGraph G,vector<Route> list);
PNGraph getEdges(PNGraph G,vector<Route> list);
vector<Route> getInput();
int addRoute(TNodeEDatNet<TNodeData, TEdgeData> &graph, std::vector<Route> list);
int hashFunction(string str);

int main(int argc, char* argv[]) 
{
  
  // PNGraph loadedGraph = TSnap::LoadEdgeList<PNGraph>("input.txt", 0, 1);
  TNodeEDatNet<TNodeData, TEdgeData> variableGraph;
  vector<Route> list =  getInput();
  addRoute(variableGraph,list);
  plotGraph(variableGraph);
  // traverseGraph(variableGraph);
  
  

}


vector<Route> getInput()
{
    //Opening filestream
        ifstream FyallStream;

        vector<Route> inputList;
        //Opening file using filename
        FyallStream.open("parsedDomesticsOutput.txt");

        if (FyallStream.peek() == std::ifstream::traits_type::eof())
        {
          cout << "Weak file" << endl;
        }

        if (FyallStream.good())
        {
          cout << "Fyall exists" << endl;
        }
        else
        {
          cout << "Fyall doesn't exists" << endl;
        }
        
        
        
        // Validates if it is a file
        if (FyallStream.is_open())
        {
          Route r1;
          cout << "Come in, its open" << endl;
          string currLine;
          while (getline(FyallStream, currLine))
          {
            // cout << "This is the currLine: " << currLine << endl;
            string temp;
            stringstream s_stream(currLine);
            getline(s_stream, temp, ',');
            r1.sourceAirport = temp;
            // cout << temp +",";
            getline(s_stream, temp, ',');
            r1.sourceCountry = temp;
            // cout << temp +",";
            getline(s_stream, temp, ',');
            r1.destinationAirport = temp;
            // cout << temp +",";
            getline(s_stream, temp, ',');
            r1.destinationCountry = temp;
            // cout << temp << endl;

            inputList.push_back(r1);
            
          }

         
          cout << "Gays" << endl;
            // Closes the fyallStream
            FyallStream.close();
            cout << "Size = " << inputList.size() << endl;
            return inputList;
        }
        else
        {
            //Closes the fyallStream
            cout << "Fuck off nosey" << endl;
            FyallStream.close();
            return inputList;
        }
}

int addRoute(TNodeEDatNet<TNodeData, TEdgeData> &graph, std::vector<Route> list)
{
	for (size_t i = 0; i < 20; i++)
	{
    int idSource = hashFunction(list[i].sourceCountry);
    int idDestination = hashFunction(list[i].destinationCountry);
		// Adds country to graph if they aren't already added
    TNodeData *source = new TNodeData(idSource, list[i].sourceCountry);
		TNodeData *destination = new TNodeData(idDestination, list[i].destinationCountry);
  
    graph.AddNode(idSource, *source);
    graph.AddNode(idDestination, *destination);
  
		// Checks if the edge we are adding exists
		if (graph.IsEdge(idSource,idDestination))
		{
			// Increment edge number
			TEdgeData flight = graph.GetEDat(idSource,idDestination);
      flight.incrementFlights();
			graph.SetEDat(idSource,idDestination, flight);
		}
		else
		{
			// Adds edge to graph
			graph.AddEdge(idSource,idDestination);
		}
	}
	return 0;
}

int hashFunction(string str) {
  hash<string> hashObj;
  return (int) hashObj(str);
}


PNGraph genRandomGraph(PNGraph G, int nodes, int edges)
{
  G = TSnap::GenRndGnm<PNGraph>(nodes, edges);
  cout << "Generated" << endl;
  return G;
}


int traverseGraph(TNodeEDatNet<TNodeData, TEdgeData> &G)
{
  cout << "Nodes" << endl;
  cout << "_____________" << endl;
  traverseNodes(G);
  cout << "-------------" << endl << endl;
  cout << "Edges" << endl;
  cout << "_____________" << endl;
  traverseEdges(G);
  return 0;
}


//From http://snap.stanford.edu/snap/quick.html#input
int traverseNodes(TNodeEDatNet<TNodeData, TEdgeData> &G)
{
  int counter =0;
  for (TNodeEDatNet<TNodeData, TEdgeData>::TNodeI NI = G.BegNI(); NI < G.EndNI(); NI++) 
    {
      cout << "Node id: " << NI.GetId() << " with out-degree " << NI.GetOutDeg() << " and in-degree " << NI.GetInDeg();
      if (counter < 2)
      {
        cout << " | ";
        counter++;
      }
      else
      {
        cout << endl;
        counter = 0;
      }
    }
    cout << endl;
    return 0;
}

//From http://snap.stanford.edu/snap/quick.html#input
int traverseEdges(TNodeEDatNet<TNodeData, TEdgeData> G)
{
  int counter = 0;
   for (TNodeEDatNet<TNodeData, TEdgeData>::TEdgeI EI = G.BegEI(); EI < G.EndEI(); EI++) 
    {
      cout << "Edge: " << EI.GetSrcNId() << "," << EI.GetDstNId();
      if (counter < 4)
      {
        cout << " | ";
        counter++;
      }
      else
      {
        cout << endl;
        counter = 0;
      }
    }
    cout << endl;
    return 0;
}

int saveGraph(TNodeEDatNet<TNodeData, TEdgeData> &G)
{
   TSnap::SaveEdgeList(G, "graphTextOut.txt", "Tab-separated list of edges");
   return 0;
}

int plotGraph(TNodeEDatNet<TNodeData, TEdgeData> &G)
{
  TIntStrH Name;
  int count = 0;
  for (TNodeEDatNet<TNodeData, TEdgeData>::TNodeI NI = G.BegNI(); NI <= G.EndNI(); NI++) 
  {
    Name.AddDat(NI.GetId()) = NI.GetId();
    count++;
  }
 
  

  TSnap::DrawGViz<TNodeEDatNet<TNodeData, TEdgeData>>(G, gvlCirco ,"gviz_plot.png", "", Name);
  cout << "Done" << endl;
  return 0;
}