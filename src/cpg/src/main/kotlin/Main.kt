import de.fraunhofer.aisec.cpg.TranslationConfiguration
import de.fraunhofer.aisec.cpg.TranslationManager
import de.fraunhofer.aisec.cpg.frontends.llvm.LLVMIRLanguageFrontend
import de.fraunhofer.aisec.cpg.graph.Node
import de.fraunhofer.aisec.cpg.graph.declarations.FunctionDeclaration
import de.fraunhofer.aisec.cpg.graph.statements.Statement
import java.io.File
import com.fasterxml.jackson.databind.ObjectMapper

fun main(args: Array<String>) {
    if (args.isEmpty()) {
        println("Usage: cpg-parser <path-to-normalized-ir-dir> <output-dir>")
        return
    }

    val inputDir = File(args[0])
    val outputDir = File(args[1])
    
    val cfgDir = File(outputDir, "cfg")
    val dfgDir = File(outputDir, "dfg")
    cfgDir.mkdirs()
    dfgDir.mkdirs()

    val files = inputDir.walkTopDown().filter { it.extension == "ll" }.toList()

    val config = TranslationConfiguration.builder()
        .sourceLocations(files)
        .defaultPasses()
        .registerLanguage(de.fraunhofer.aisec.cpg.frontends.llvm.LLVMIRLanguage())
        .build()

    val analyzer = TranslationManager.builder().config(config).build()
    val result = analyzer.analyze().get()

    val mapper = ObjectMapper()

    for (node in result.translationUnits) {
        for (declaration in node.declarations) {
            if (declaration is FunctionDeclaration) {
                val funcName = declaration.name
                
                // Extract CFG
                val cfgNodes = mutableListOf<Map<String, Any>>()
                val cfgEdges = mutableListOf<Map<String, Any>>()
                
                // Simplified DFS for CFG extraction
                val visited = mutableSetOf<Node>()
                fun dfsCfg(curr: Node) {
                    if (visited.contains(curr)) return
                    visited.add(curr)
                    
                    cfgNodes.add(mapOf("id" to curr.id.toString(), "code" to (curr.code ?: ""), "type" to curr.javaClass.simpleName))
                    
                    for (next in curr.nextCFG) {
                        cfgEdges.add(mapOf("source" to curr.id.toString(), "target" to next.id.toString()))
                        dfsCfg(next)
                    }
                }
                
                declaration.body?.let { dfsCfg(it) }

                val cfgMap = mapOf("function" to funcName.toString(), "nodes" to cfgNodes, "edges" to cfgEdges)
                File(cfgDir, "${funcName}.json").writeText(mapper.writeValueAsString(cfgMap))

                // Extract DFG
                val dfgNodes = mutableListOf<Map<String, Any>>()
                val dfgEdges = mutableListOf<Map<String, Any>>()
                
                val dfgVisited = mutableSetOf<Node>()
                fun dfsDfg(curr: Node) {
                    if (dfgVisited.contains(curr)) return
                    dfgVisited.add(curr)
                    
                    dfgNodes.add(mapOf("id" to curr.id.toString(), "code" to (curr.code ?: ""), "type" to curr.javaClass.simpleName))
                    
                    for (next in curr.nextDFG) {
                        dfgEdges.add(mapOf("source" to curr.id.toString(), "target" to next.id.toString()))
                        dfsDfg(next)
                    }
                }
                
                declaration.body?.let { dfsDfg(it) }
                
                val dfgMap = mapOf("function" to funcName.toString(), "nodes" to dfgNodes, "edges" to dfgEdges)
                File(dfgDir, "${funcName}.json").writeText(mapper.writeValueAsString(dfgMap))
            }
        }
    }
}
