#pragma once

// These will improve the readability of the connection definition

#define getT(Idx) template get<Idx>()
#define connectT(Idx, target) template connect<Idx>(target)
#define getParameterT(Idx) template getParameter<Idx>()
#define setParameterT(Idx, value) template setParameter<Idx>(value)
#define setParameterWT(Idx, value) template setWrapParameter<Idx>(value)
using namespace scriptnode;
using namespace snex;
using namespace snex::Types;

namespace NeuralAmpModeller_impl
{
// ==============================| Node & Parameter type declarations |==============================

struct matrix1_t_matrix: public routing::static_matrix<2, matrix1_t_matrix, false>
{
	static constexpr int channels[2] =
	{
		0, -1
	};
};
using neural1_t_index = runtime_target::indexers::fix_hash<740473403>;

struct convolution_t_data: public data::embedded::multichannel_data
{
	// Metadata functions for embedded data --------------------------------------------------------
	
	int    getNumSamples()     const override { return 8192; }
	double getSamplerate()     const override { return 48000.; }
	int    getNumChannels()    const override { return 1; }
	const float* getChannelData(int index) override
	{
		if(index == 0) { return reinterpret_cast<const float*>(audiodata::NeuralAmpModeller_impl_convolution_t_data0); }
		jassertfalse;    return nullptr;
	};
};

using convolution_t = wrap::data<wrap::no_process<filters::convolution>, 
                                 data::embedded::audiofile<convolution_t_data>>;

template <int NV>
using NeuralAmpModeller_t_ = container::chain<parameter::empty, 
                                              wrap::fix<2, routing::matrix<matrix1_t_matrix>>, 
                                              math::neural<NV, neural1_t_index, HpfFrequency::Hz5>, 
                                              convolution_t>;

// =================================| Root node initialiser class |=================================

template <int NV> struct instance: public NeuralAmpModeller_impl::NeuralAmpModeller_t_<NV>
{
	
	struct metadata
	{
		static const int NumTables = 0;
		static const int NumSliderPacks = 0;
		static const int NumAudioFiles = 0;
		static const int NumFilters = 0;
		static const int NumDisplayBuffers = 0;
		
		SNEX_METADATA_ID(NeuralAmpModeller);
		SNEX_METADATA_NUM_CHANNELS(2);
		SNEX_METADATA_ENCODED_PARAMETERS(2)
		{
			0x0000, 0x0000
		};
		SNEX_METADATA_ENCODED_MOD_INFO(2)
		{
			0x3D3B, 0x003E
		};
	};
	
	instance()
	{
		// Node References -------------------------------------------------------------------------
		
		auto& matrix1 = this->getT(0);     // routing::matrix<matrix1_t_matrix>
		auto& neural1 = this->getT(1);     // math::neural<NV, neural1_t_index, HpfFrequency::Hz5>
		auto& convolution = this->getT(2); // NeuralAmpModeller_impl::convolution_t
		
		// Default Values --------------------------------------------------------------------------
		
		convolution.setParameterT(0, 1.);     // filters::convolution::Gate
		convolution.setParameterT(1, 0.);     // filters::convolution::Predelay
		convolution.setParameterT(2, 0.);     // filters::convolution::Damping
		convolution.setParameterT(3, 20000.); // filters::convolution::HiCut
		convolution.setParameterT(4, 0.);     // filters::convolution::Multithread
		
		this->setExternalData({}, -1);
	}
	~instance() override
	{
		// Cleanup external data references --------------------------------------------------------
		
		this->setExternalData({}, -1);
	}
	
	static constexpr bool isPolyphonic() { return NV > 1; };
	
	static constexpr bool hasTail() { return true; };
	
	static constexpr bool isSuspendedOnSilence() { return false; };
	
	void connectToRuntimeTarget(bool addConnection, const runtime_target::connection& c)
	{
		// Runtime target Connections --------------------------------------------------------------
		
		this->getT(1).connectToRuntimeTarget(addConnection, c); // math::neural<NV, neural1_t_index, HpfFrequency::Hz5>
	}
	
	void setExternalData(const ExternalData& b, int index)
	{
		// External Data Connections ---------------------------------------------------------------
		
		this->getT(2).setExternalData(b, index); // NeuralAmpModeller_impl::convolution_t
	}
};
}

#undef getT
#undef connectT
#undef setParameterT
#undef setParameterWT
#undef getParameterT
// ======================================| Public Definition |======================================

namespace project
{
// polyphonic template declaration

template <int NV>
using NeuralAmpModeller = wrap::node<NeuralAmpModeller_impl::instance<NV>>;
}


